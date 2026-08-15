// Marketplace purchase flow: split checkout, fulfilment, and refunds.
//
// Money integrity rules this file exists to enforce (docs/BUSINESS_MODEL.md §8):
//   1. Webhooks are the source of truth. Access is granted on
//      checkout.session.completed, never on the browser hitting a success URL —
//      a user can navigate straight to that URL without paying.
//   2. Idempotent. Orders are keyed on the Stripe session id and every applied
//      event id is recorded, so Stripe's at-least-once delivery cannot
//      double-grant access or double-credit a creator.
//   3. Refunds revoke. A refund deactivates the entitlement and posts a
//      reversing ledger entry rather than editing the original.
//   4. The split is computed server-side from the Course document. The client
//      never sends a price or a percentage.

import Stripe from "stripe";
import Course from "../../models/Course.js";
import Order from "../../models/Order.js";
import Entitlement from "../../models/Entitlement.js";
import LedgerEntry from "../../models/LedgerEntry.js";
import CreatorProfile from "../../models/CreatorProfile.js";
import { splitSale, PAYOUT, CURRENCY } from "../../config/monetization.js";

let _stripe = null;
const stripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  if (!_stripe) _stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  return _stripe;
};

const frontend = () =>
  (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/+$/, "");

/**
 * Build a Checkout session for a single course.
 *
 * Marketplace courses use a destination charge: Stripe moves the creator's
 * share to their connected account and keeps our application fee behind,
 * atomically. Splitting afterwards would mean the platform briefly holding
 * money it owes someone else.
 */
export const createCourseCheckout = async ({ user, courseId }) => {
  const s = stripe();
  if (!s) throw Object.assign(new Error("Billing is not configured."), { status: 503 });

  const course = await Course.findById(courseId).populate("instructor", "name email");
  if (!course) throw Object.assign(new Error("Course not found."), { status: 404 });

  if (course.status !== "published" || course.isArchived) {
    throw Object.assign(new Error("This course is not available for purchase."), {
      status: 400,
    });
  }
  if ((course.priceCents ?? 0) <= 0) {
    throw Object.assign(new Error("This course is free — no purchase needed."), {
      status: 400,
    });
  }

  // Never sell the same thing twice.
  const already = await Entitlement.findOne({
    user: user._id,
    resourceType: "course",
    resource: course._id,
    status: "active",
  });
  if (already) {
    throw Object.assign(new Error("You already own this course."), { status: 409 });
  }

  // Price and split both come from the server. Anything the client sent is
  // ignored by construction — it is never read.
  const isMarketplace = course.ownership === "marketplace";
  let feeBps = 0;
  let destinationAccount = null;

  if (isMarketplace) {
    const profile = await CreatorProfile.findOne({ user: course.instructor._id });
    if (!profile?.canSellPaidCourses()) {
      // Refuse rather than take money we could not pass on.
      throw Object.assign(
        new Error("This course is temporarily unavailable for purchase."),
        { status: 409 }
      );
    }
    feeBps = profile.platformFeeBps;
    destinationAccount = profile.stripeAccountId;
  }

  const split = splitSale(course.priceCents, feeBps || undefined);

  const session = await s.checkout.sessions.create({
    mode: "payment",
    customer_email: user.email,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: CURRENCY,
          unit_amount: course.priceCents,
          product_data: {
            name: course.title,
            description: course.shortDescription?.slice(0, 300),
            ...(course.thumbnail ? { images: [course.thumbnail] } : {}),
          },
        },
      },
    ],
    success_url: `${frontend()}/courses/${course._id}?purchase=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${frontend()}/courses/${course._id}?purchase=cancelled`,
    // Everything fulfilment needs, so the webhook does not have to guess.
    metadata: {
      kind: "course",
      userId: String(user._id),
      courseId: String(course._id),
      creatorId: String(course.instructor._id),
      feeBps: String(split.feeBps),
    },
    payment_intent_data: {
      metadata: { kind: "course", userId: String(user._id), courseId: String(course._id) },
      ...(destinationAccount
        ? {
            application_fee_amount: split.platformFeeCents,
            transfer_data: { destination: destinationAccount },
          }
        : {}),
    },
  });

  // Recorded up front so a webhook that arrives before the browser redirect
  // still finds an order to fulfil.
  await Order.create({
    user: user._id,
    kind: "course",
    course: course._id,
    creator: isMarketplace ? course.instructor._id : null,
    snapshot: {
      title: course.title,
      priceCents: course.priceCents,
      creatorName: course.instructor?.name,
    },
    grossCents: split.grossCents,
    platformFeeCents: isMarketplace ? split.platformFeeCents : split.grossCents,
    creatorEarningsCents: isMarketplace ? split.creatorEarningsCents : 0,
    feeBps: split.feeBps,
    stripeSessionId: session.id,
    status: "pending",
  });

  return { url: session.url, sessionId: session.id };
};

/**
 * Fulfil a completed checkout: grant access and credit the creator.
 *
 * Safe to call repeatedly with the same event — that is the point.
 */
export const fulfilCourseOrder = async (session, eventId) => {
  const order = await Order.findOne({ stripeSessionId: session.id });
  if (!order) {
    console.warn(`No order for session ${session.id}; ignoring.`);
    return null;
  }

  if (order.hasProcessed(eventId)) {
    return order; // replay
  }
  if (order.status === "paid") {
    order.markProcessed(eventId);
    await order.save();
    return order;
  }

  order.status = "paid";
  order.paidAt = new Date();
  order.stripePaymentIntentId = session.payment_intent ?? null;
  order.markProcessed(eventId);
  await order.save();

  // Access first — a failure crediting the creator must never leave a paying
  // learner locked out of what they bought.
  await Entitlement.grant({
    user: order.user,
    resourceType: "course",
    resource: order.course,
    source: "purchase",
    order: order._id,
  });

  await Course.findByIdAndUpdate(order.course, {
    $inc: { salesCount: 1, grossRevenueCents: order.grossCents, enrollmentCount: 1 },
  });

  if (order.creator && order.creatorEarningsCents > 0) {
    // Held briefly so a fast refund cannot drive the balance negative.
    const availableAt = new Date(Date.now() + PAYOUT.HOLD_DAYS * 86400000);

    await LedgerEntry.create({
      creator: order.creator,
      type: "sale",
      amountCents: order.creatorEarningsCents,
      order: order._id,
      course: order.course,
      availableAt,
      description: `Sale: ${order.snapshot?.title ?? "course"}`,
      // Unique per order, so a replayed event cannot post a second credit.
      idempotencyKey: `sale:${order._id}`,
    }).catch((err) => {
      if (err.code === 11000) return null; // already posted
      throw err;
    });

    await CreatorProfile.findOneAndUpdate(
      { user: order.creator },
      {
        $inc: {
          "stats.totalSales": 1,
          "stats.grossRevenueCents": order.grossCents,
          "stats.netEarningsCents": order.creatorEarningsCents,
        },
      }
    );
  }

  return order;
};

/**
 * Reverse a refunded purchase: revoke access and debit the creator.
 *
 * The original ledger entry is never edited — a reversing entry is posted, so
 * history always reconciles.
 */
export const refundCourseOrder = async (charge, eventId) => {
  const order = await Order.findOne({
    $or: [
      { stripePaymentIntentId: charge.payment_intent },
      { stripeChargeId: charge.id },
    ],
  });
  if (!order || order.hasProcessed(eventId)) return order;

  const refundedCents = charge.amount_refunded ?? charge.amount ?? order.grossCents;
  const isFull = refundedCents >= order.grossCents;

  order.status = isFull ? "refunded" : "partially_refunded";
  order.refundedCents = refundedCents;
  order.refundedAt = new Date();
  order.stripeChargeId = charge.id;
  order.markProcessed(eventId);
  await order.save();

  if (isFull) {
    await Entitlement.revokeByOrder(order._id, "refunded");
    await Course.findByIdAndUpdate(order.course, {
      $inc: { salesCount: -1, grossRevenueCents: -order.grossCents, enrollmentCount: -1 },
    });
  }

  if (order.creator && order.creatorEarningsCents > 0) {
    const original = await LedgerEntry.findOne({ idempotencyKey: `sale:${order._id}` });
    // Proportional to what was actually refunded.
    const debit = isFull
      ? order.creatorEarningsCents
      : Math.floor((order.creatorEarningsCents * refundedCents) / order.grossCents);

    await LedgerEntry.create({
      creator: order.creator,
      type: "refund",
      amountCents: -debit,
      order: order._id,
      course: order.course,
      reverses: original?._id ?? null,
      description: `Refund: ${order.snapshot?.title ?? "course"}`,
      idempotencyKey: `refund:${order._id}:${eventId}`,
    }).catch((err) => {
      if (err.code === 11000) return null;
      throw err;
    });

    await CreatorProfile.findOneAndUpdate(
      { user: order.creator },
      { $inc: { "stats.netEarningsCents": -debit, "stats.totalSales": isFull ? -1 : 0 } }
    );
  }

  return order;
};

export default { createCourseCheckout, fulfilCourseOrder, refundCourseOrder };
