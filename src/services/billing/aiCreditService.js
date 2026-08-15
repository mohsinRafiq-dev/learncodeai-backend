// AI credit metering.
//
// Closes the gap where the pricing page advertised AI limits that nothing
// enforced: User.aiPromptsUsedToday existed and was never read, so free users
// had unmetered access to a paid API.
//
// Credits are consumed per action (see AI_ACTION_COST). The allocation is
// snapshotted when the period opens, so a mid-period downgrade cannot
// retroactively push someone over their limit.
//
// Spec: docs/BUSINESS_MODEL.md §2

import AiUsage from "../../models/AiUsage.js";
import { AI_ACTION_COST } from "../../config/monetization.js";
import { planFor, effectivePlanKey } from "./entitlementService.js";

export class InsufficientCreditsError extends Error {
  constructor(needed, remaining, planKey) {
    super(
      `Not enough AI credits: this action costs ${needed}, you have ${remaining} left.`
    );
    this.name = "InsufficientCreditsError";
    this.code = "INSUFFICIENT_AI_CREDITS";
    this.needed = needed;
    this.remaining = remaining;
    this.planKey = planKey;
  }
}

const periodBounds = (date = new Date()) => {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
  return { start, end };
};

/**
 * The user's usage row for the current period, created on first use.
 *
 * Uses an upsert rather than find-then-create so two concurrent AI requests
 * cannot both create the row and have one fail on the unique index.
 */
export const getOrCreateUsage = async (user) => {
  const period = AiUsage.currentPeriod();
  const { start, end } = periodBounds();
  const plan = planFor(user);

  return AiUsage.findOneAndUpdate(
    { user: user._id, period },
    {
      $setOnInsert: {
        user: user._id,
        period,
        creditsAllocated: plan.aiCreditsPerMonth,
        planKey: effectivePlanKey(user),
        periodStart: start,
        periodEnd: end,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

/**
 * Raise the allocation when a user upgrades mid-period.
 *
 * Only ever increases. A downgrade leaves the current period alone — the user
 * paid for those credits — and takes effect when the next period opens.
 */
export const syncAllocationForPlan = async (user) => {
  const usage = await getOrCreateUsage(user);
  const plan = planFor(user);
  if (plan.aiCreditsPerMonth > usage.creditsAllocated) {
    usage.creditsAllocated = plan.aiCreditsPerMonth;
    usage.planKey = effectivePlanKey(user);
    await usage.save();
  }
  return usage;
};

/** Cost of an action, without consuming anything. */
export const costOf = (action) => {
  const cost = AI_ACTION_COST[action];
  if (cost === undefined) throw new Error(`Unknown AI action: ${action}`);
  return cost;
};

/** Non-mutating check, for rendering the UI before the user commits. */
export const check = async (user, action) => {
  const usage = await getOrCreateUsage(user);
  const needed = costOf(action);
  const remaining = Math.max(0, usage.creditsAllocated - usage.creditsUsed);
  return {
    allowed: remaining >= needed,
    needed,
    remaining,
    allocated: usage.creditsAllocated,
    used: usage.creditsUsed,
    planKey: usage.planKey,
    resetsAt: usage.periodEnd,
  };
};

/**
 * Consume credits for an action.
 *
 * The debit is conditional on sufficient balance *inside* the update, so two
 * concurrent requests cannot both pass a separate check and overdraw. If the
 * conditional update matches nothing, the balance was insufficient.
 *
 * @throws {InsufficientCreditsError}
 */
export const consume = async (user, action, { meta = {} } = {}) => {
  const needed = costOf(action);
  const period = AiUsage.currentPeriod();

  await getOrCreateUsage(user);

  const updated = await AiUsage.findOneAndUpdate(
    {
      user: user._id,
      period,
      // Atomic guard: only debit if the remaining balance covers the cost.
      $expr: { $gte: [{ $subtract: ["$creditsAllocated", "$creditsUsed"] }, needed] },
    },
    {
      $inc: {
        creditsUsed: needed,
        [`byAction.${action}`]: needed,
      },
    },
    { new: true }
  );

  if (!updated) {
    const state = await check(user, action);
    await AiUsage.updateOne({ user: user._id, period }, { $inc: { deniedCount: 1 } });
    throw new InsufficientCreditsError(needed, state.remaining, state.planKey);
  }

  return {
    charged: needed,
    remaining: Math.max(0, updated.creditsAllocated - updated.creditsUsed),
    allocated: updated.creditsAllocated,
    resetsAt: updated.periodEnd,
    meta,
  };
};

/**
 * Return credits when an action failed for reasons that are not the user's
 * fault — a provider outage, or a sandbox that was unavailable. Charging for a
 * failure the platform caused is indefensible.
 */
export const refund = async (user, action, reason = "action_failed") => {
  const amount = costOf(action);
  const period = AiUsage.currentPeriod();

  const updated = await AiUsage.findOneAndUpdate(
    { user: user._id, period, creditsUsed: { $gte: amount } },
    {
      $inc: {
        creditsUsed: -amount,
        [`byAction.${action}`]: -amount,
      },
    },
    { new: true }
  );

  if (updated) {
    console.log(
      `Refunded ${amount} AI credits to ${user._id} for ${action} (${reason})`
    );
  }
  return updated;
};

/** Usage summary for the profile and Studio dashboards. */
export const summaryFor = async (user) => {
  const usage = await getOrCreateUsage(user);
  return {
    period: usage.period,
    planKey: usage.planKey,
    allocated: usage.creditsAllocated,
    used: usage.creditsUsed,
    remaining: Math.max(0, usage.creditsAllocated - usage.creditsUsed),
    percentUsed: usage.percentUsed,
    byAction: usage.byAction,
    deniedCount: usage.deniedCount,
    resetsAt: usage.periodEnd,
    costs: AI_ACTION_COST,
  };
};

export default {
  getOrCreateUsage,
  syncAllocationForPlan,
  costOf,
  check,
  consume,
  refund,
  summaryFor,
  InsufficientCreditsError,
};
