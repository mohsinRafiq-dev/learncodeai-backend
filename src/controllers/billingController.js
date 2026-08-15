// Billing controller — handles Stripe checkout, customer portal, and webhooks.
// Pricing/gating decisions documented in memory: project-business-model.

import Stripe from "stripe";
import User from "../models/User.js";
import aiCreditService from "../services/billing/aiCreditService.js";
import {
  accessSummary,
  entitledCourseIds,
} from "../services/billing/entitlementService.js";

// Lazy-construct Stripe so the server still boots if STRIPE_SECRET_KEY is missing
// (useful for local dev / FYP partial setup). Routes return 503 in that case.
let _stripe = null;
const stripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  if (!_stripe) _stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  return _stripe;
};

const requireStripe = (res) => {
  const s = stripe();
  if (!s) {
    res.status(503).json({
      success: false,
      message: "Billing is not configured on this server.",
    });
    return null;
  }
  return s;
};

const PLAN_TO_PRICE = {
  pro_monthly: () => process.env.STRIPE_PRICE_PRO_MONTHLY,
  pro_yearly: () => process.env.STRIPE_PRICE_PRO_YEARLY,
  lifetime: () => process.env.STRIPE_PRICE_LIFETIME,
};
const COURSE_PRICE = {
  python: () => process.env.STRIPE_PRICE_COURSE_PYTHON,
  javascript: () => process.env.STRIPE_PRICE_COURSE_JAVASCRIPT,
  cpp: () => process.env.STRIPE_PRICE_COURSE_CPP,
};

const successUrl = () =>
  process.env.STRIPE_SUCCESS_URL ||
  (process.env.FRONTEND_URL || "http://localhost:5173") +
    "/billing/success?session_id={CHECKOUT_SESSION_ID}";
const cancelUrl = () =>
  process.env.STRIPE_CANCEL_URL ||
  (process.env.FRONTEND_URL || "http://localhost:5173") + "/pricing";

// Ensure the User has a Stripe Customer attached. Creates one on first call.
const ensureStripeCustomer = async (s, user) => {
  if (user.stripeCustomerId) return user.stripeCustomerId;
  const customer = await s.customers.create({
    email: user.email,
    name: user.name,
    metadata: { userId: user._id.toString() },
  });
  user.stripeCustomerId = customer.id;
  await user.save();
  return customer.id;
};

// GET /api/billing/me — what the frontend reads to render badges + portal link
export const getMyBilling = async (req, res) => {
  const u = req.user;
  const [credits, entitledCourses] = await Promise.all([
    aiCreditService.summaryFor(u).catch(() => null),
    entitledCourseIds(u._id).catch(() => []),
  ]);

  res.json({
    success: true,
    data: {
      tier: u.subscriptionTier,
      status: u.subscriptionStatus,
      expiresAt: u.subscriptionExpiresAt,
      // Sourced from Entitlement rather than the deprecated array, so refunded
      // purchases correctly disappear.
      purchasedCourses: entitledCourses,
      hasStripeCustomer: !!u.stripeCustomerId,
      hasActiveSubscription: !!u.stripeSubscriptionId,
      access: accessSummary(u),
      credits,
    },
  });
};

// GET /api/billing/ai-credits — polled by the AI panels to render the meter.
export const getAiCredits = async (req, res) => {
  const summary = await aiCreditService.summaryFor(req.user);
  res.json({ success: true, data: summary });
};

// POST /api/billing/create-checkout-session
// body: { plan: "pro_monthly" | "pro_yearly" | "lifetime" | "course",
//         courseId?, courseLanguage?: "python"|"javascript"|"cpp" }
export const createCheckoutSession = async (req, res) => {
  const s = requireStripe(res);
  if (!s) return;

  const user = req.user;
  const { plan, courseId, courseLanguage } = req.body || {};

  let priceId = null;
  let mode = "subscription";
  let metadata = { userId: user._id.toString(), plan };

  if (plan === "lifetime") {
    priceId = PLAN_TO_PRICE.lifetime();
    mode = "payment";
  } else if (plan === "pro_monthly" || plan === "pro_yearly") {
    priceId = PLAN_TO_PRICE[plan]();
    mode = "subscription";
  } else if (plan === "course") {
    if (!courseLanguage || !COURSE_PRICE[courseLanguage]) {
      return res.status(400).json({
        success: false,
        message: "Invalid courseLanguage for single-course purchase.",
      });
    }
    priceId = COURSE_PRICE[courseLanguage]();
    mode = "payment";
    if (courseId) metadata.courseId = String(courseId);
    metadata.courseLanguage = courseLanguage;
  } else {
    return res.status(400).json({
      success: false,
      message: `Unknown plan: ${plan}`,
    });
  }

  if (!priceId) {
    return res.status(503).json({
      success: false,
      message: `Stripe price ID is not configured for plan "${plan}".`,
    });
  }

  const customerId = await ensureStripeCustomer(s, user);

  const session = await s.checkout.sessions.create({
    mode,
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl(),
    cancel_url: cancelUrl(),
    allow_promotion_codes: true,
    metadata,
    // Only valid for subscription mode
    ...(mode === "subscription"
      ? { subscription_data: { metadata } }
      : { payment_intent_data: { metadata } }),
  });

  res.json({ success: true, data: { url: session.url, id: session.id } });
};

// POST /api/billing/create-portal-session — Stripe Customer Portal
export const createPortalSession = async (req, res) => {
  const s = requireStripe(res);
  if (!s) return;

  const user = req.user;
  if (!user.stripeCustomerId) {
    return res.status(400).json({
      success: false,
      message: "No Stripe customer attached to this account yet.",
    });
  }

  const session = await s.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url:
      (process.env.FRONTEND_URL || "http://localhost:5173") + "/profile?tab=settings",
  });

  res.json({ success: true, data: { url: session.url } });
};

// Apply a successful subscription event to the user
const applySubscriptionToUser = async (user, subscription) => {
  user.stripeSubscriptionId = subscription.id;
  user.subscriptionStatus = subscription.status;
  user.subscriptionExpiresAt = subscription.current_period_end
    ? new Date(subscription.current_period_end * 1000)
    : null;
  const isActive = ["active", "trialing"].includes(subscription.status);
  // Only flip to "pro" while subscription is active. If canceled, downgrade.
  if (isActive) user.subscriptionTier = "pro";
  else if (user.subscriptionTier !== "lifetime")
    user.subscriptionTier = "free";
  await user.save();
};

// POST /api/billing/webhook — Stripe webhook endpoint.
// Mounted with express.raw() so signature verification gets the raw body.
export const handleWebhook = async (req, res) => {
  const s = requireStripe(res);
  if (!s) return;

  const sig = req.headers["stripe-signature"];
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!whSecret) {
    return res.status(503).send("STRIPE_WEBHOOK_SECRET not configured");
  }

  let event;
  try {
    event = s.webhooks.constructEvent(req.body, sig, whSecret);
  } catch (err) {
    console.error("❌ Stripe webhook signature failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId =
          session.metadata?.userId ||
          session.subscription_details?.metadata?.userId;
        if (!userId) break;
        const user = await User.findById(userId);
        if (!user) break;

        if (session.mode === "payment" && session.metadata?.plan === "lifetime") {
          user.subscriptionTier = "lifetime";
          user.subscriptionStatus = "active";
          user.subscriptionExpiresAt = null;
          await user.save();
        } else if (session.mode === "payment" && session.metadata?.plan === "course") {
          if (session.metadata.courseId) {
            const id = session.metadata.courseId;
            if (!user.purchasedCourses.map(String).includes(id)) {
              user.purchasedCourses.push(id);
              await user.save();
            }
          }
        } else if (session.mode === "subscription" && session.subscription) {
          const subscription = await s.subscriptions.retrieve(
            session.subscription
          );
          await applySubscriptionToUser(user, subscription);
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const userId = subscription.metadata?.userId;
        const user = userId
          ? await User.findById(userId)
          : await User.findOne({ stripeCustomerId: subscription.customer });
        if (user) await applySubscriptionToUser(user, subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const user = await User.findOne({
          stripeCustomerId: subscription.customer,
        });
        if (user) {
          user.stripeSubscriptionId = null;
          user.subscriptionStatus = "canceled";
          user.subscriptionExpiresAt = null;
          if (user.subscriptionTier !== "lifetime") {
            user.subscriptionTier = "free";
          }
          await user.save();
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const user = await User.findOne({
          stripeCustomerId: invoice.customer,
        });
        if (user) {
          user.subscriptionStatus = "past_due";
          await user.save();
        }
        break;
      }

      default:
        // Other event types — ignore for now.
        break;
    }
    res.json({ received: true });
  } catch (err) {
    console.error("Webhook handler error:", err);
    res.status(500).send("Webhook handler error");
  }
};

export default {
  getMyBilling,
  getAiCredits,
  createCheckoutSession,
  createPortalSession,
  handleWebhook,
};
