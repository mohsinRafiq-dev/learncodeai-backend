// Charges AI credits for a request, and gives them back if the platform is
// what failed.
//
// Credits are consumed *before* the handler runs, not after. Checking first and
// debiting later leaves a window where two concurrent requests both pass the
// check and overdraw the balance; aiCreditService.consume performs the debit
// conditionally inside a single update, so the charge either succeeds
// atomically or throws.
//
// The trade-off is that a failed request has already been charged, so this
// middleware watches the response and refunds automatically when the failure
// was ours (5xx, or an explicitly flagged upstream outage). A user should never
// pay credits because Gemini was down or the sandbox was restarting.

import aiCreditService, {
  InsufficientCreditsError,
} from "../services/billing/aiCreditService.js";
import { accessSummary } from "../services/billing/entitlementService.js";

// Statuses that mean "the platform failed", as opposed to "the user asked for
// something invalid". A 400 is the user's fault and stays charged; a 502 is not.
const PLATFORM_FAILURE = (status) => status >= 500;

/**
 * @param {string} action  key from AI_ACTION_COST
 * @param {object} [opts]
 * @param {boolean} [opts.refundOnFailure=true]
 */
export const chargeAiCredits = (action, { refundOnFailure = true } = {}) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Sign in to use AI features.",
      });
    }

    try {
      const result = await aiCreditService.consume(req.user, action);

      // Exposed so handlers can surface the balance in their response.
      req.aiCredits = {
        action,
        charged: result.charged,
        remaining: result.remaining,
        allocated: result.allocated,
        resetsAt: result.resetsAt,
        refunded: false,
      };

      // Tell the client where they stand without needing a second request.
      res.set("X-AI-Credits-Remaining", String(result.remaining));
      res.set("X-AI-Credits-Charged", String(result.charged));

      if (refundOnFailure) {
        // 'finish' fires once the response is fully sent, so the status is
        // final by then — including for handlers that fail asynchronously.
        res.on("finish", () => {
          if (PLATFORM_FAILURE(res.statusCode) && !req.aiCredits.refunded) {
            req.aiCredits.refunded = true;
            aiCreditService
              .refund(req.user, action, `http_${res.statusCode}`)
              .catch((err) =>
                console.warn(`AI credit refund failed: ${err.message}`)
              );
          }
        });
      }

      return next();
    } catch (err) {
      if (err instanceof InsufficientCreditsError) {
        const summary = accessSummary(req.user);
        return res.status(402).json({
          success: false,
          code: err.code,
          message:
            summary.planKey === "free"
              ? "You've used all your AI credits for this month. Upgrade to Pro for 2,000 credits/month."
              : "You've used all your AI credits for this month. They reset at the start of your next billing period.",
          credits: {
            needed: err.needed,
            remaining: err.remaining,
            planKey: err.planKey,
          },
          upgradeUrl: summary.planKey === "free" ? "/pricing" : null,
        });
      }

      console.error("AI credit charge failed:", err);
      // Never block a user because our metering broke. Fail open, and log it —
      // losing a few credits' revenue beats an outage of every AI feature.
      req.aiCredits = { action, charged: 0, meteringFailed: true };
      return next();
    }
  };
};

/**
 * Gate a feature that a plan does not include at all, independent of credits.
 * Verified generation is Pro-only, for instance.
 */
export const requirePlanFeature = (feature) => (req, res, next) => {
  const summary = accessSummary(req.user);
  if (summary.features?.[feature]) return next();

  return res.status(402).json({
    success: false,
    code: "FEATURE_NOT_IN_PLAN",
    message: `${feature} is available on Pro and Lifetime plans.`,
    upgradeUrl: "/pricing",
  });
};

/** Attach the credit summary without charging — for rendering the UI. */
export const attachCreditSummary = async (req, _res, next) => {
  if (!req.user) return next();
  try {
    req.creditSummary = await aiCreditService.summaryFor(req.user);
  } catch (err) {
    console.warn("Could not load credit summary:", err.message);
  }
  next();
};

export default { chargeAiCredits, requirePlanFeature, attachCreditSummary };
