// Stripe Connect Express — creator payout rails.
//
// Creators onboard to their own Express account. Stripe handles identity
// verification, tax forms and bank payouts, so the platform never holds
// creator funds or their bank details.
//
// At checkout we use a destination charge with an application fee: the learner
// pays the platform, Stripe moves the creator's 70% to their connected account
// and keeps our 30% behind, atomically. Doing the split ourselves afterwards
// would mean holding money we owe someone else, which is both a regulatory
// problem and an operational one.
//
// Spec: docs/BUSINESS_MODEL.md §3

import Stripe from "stripe";
import CreatorProfile from "../../models/CreatorProfile.js";

let _stripe = null;
const stripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  if (!_stripe) _stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  return _stripe;
};

export class ConnectNotConfiguredError extends Error {
  constructor() {
    super("Stripe is not configured on this server.");
    this.code = "STRIPE_NOT_CONFIGURED";
  }
}

const requireStripe = () => {
  const s = stripe();
  if (!s) throw new ConnectNotConfiguredError();
  return s;
};

/**
 * Create the connected account for a creator, or return the existing one.
 *
 * Idempotent: re-running never creates a second account. A duplicate would
 * split a creator's earnings across two balances with no way to merge them.
 */
export const ensureConnectedAccount = async (profile, user) => {
  const s = requireStripe();

  if (profile.stripeAccountId) {
    return profile.stripeAccountId;
  }

  const account = await s.accounts.create({
    type: "express",
    country: profile.application?.payoutCountry || "US",
    email: user.email,
    business_type: "individual",
    capabilities: {
      transfers: { requested: true },
    },
    business_profile: {
      name: profile.application?.displayName || user.name,
      product_description: "Programming courses on LearnCode AI",
    },
    metadata: {
      userId: String(user._id),
      creatorProfileId: String(profile._id),
    },
    settings: {
      payouts: {
        schedule: { interval: "manual" },
      },
    },
  });

  profile.stripeAccountId = account.id;
  await profile.save();

  return account.id;
};

/**
 * A single-use link into Stripe's hosted onboarding.
 *
 * These expire in minutes and can only be used once, so it must be generated
 * on demand rather than stored.
 */
export const createOnboardingLink = async (profile, { returnUrl, refreshUrl }) => {
  const s = requireStripe();
  if (!profile.stripeAccountId) {
    throw new Error("No connected account — call ensureConnectedAccount first.");
  }

  const link = await s.accountLinks.create({
    account: profile.stripeAccountId,
    // Stripe sends the creator here if the link expired before they finished,
    // and we simply mint a new one.
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: "account_onboarding",
  });

  return link.url;
};

/** Express dashboard link, for a creator who has already onboarded. */
export const createDashboardLink = async (profile) => {
  const s = requireStripe();
  if (!profile.stripeAccountId) throw new Error("No connected account.");
  const link = await s.accounts.createLoginLink(profile.stripeAccountId);
  return link.url;
};

/**
 * Pull the account's live state into the profile.
 *
 * Called both on demand (when the creator returns from onboarding) and from
 * the account.updated webhook, so the Studio never shows stale capability
 * flags.
 */
export const syncAccountStatus = async (profile, account = null) => {
  const s = requireStripe();
  if (!profile.stripeAccountId) return profile;

  const acct = account ?? (await s.accounts.retrieve(profile.stripeAccountId));

  profile.chargesEnabled = Boolean(acct.charges_enabled);
  profile.payoutsEnabled = Boolean(acct.payouts_enabled);
  profile.detailsSubmitted = Boolean(acct.details_submitted);

  // Surfaced verbatim in the Studio so a blocked creator knows precisely what
  // Stripe is waiting for, rather than "onboarding incomplete".
  const req = acct.requirements ?? {};
  profile.requirementsDue = [
    ...(req.currently_due ?? []),
    ...(req.past_due ?? []),
  ];

  if (profile.payoutsEnabled && !profile.onboardingCompletedAt) {
    profile.onboardingCompletedAt = new Date();
  }

  await profile.save();
  return profile;
};

/** Find the profile a Connect webhook refers to. */
export const profileForAccount = async (accountId) =>
  CreatorProfile.findOne({ stripeAccountId: accountId });

/**
 * Move money to a creator's connected account.
 *
 * Payouts are manual (see the account settings above) so the platform decides
 * when funds move, rather than Stripe sweeping them on a schedule we cannot
 * reconcile against our own ledger.
 */
export const createTransfer = async ({
  destinationAccountId,
  amountCents,
  currency = "usd",
  metadata = {},
  idempotencyKey,
}) => {
  const s = requireStripe();
  return s.transfers.create(
    {
      amount: amountCents,
      currency,
      destination: destinationAccountId,
      metadata,
    },
    // Without this a retried request could pay a creator twice.
    idempotencyKey ? { idempotencyKey } : undefined
  );
};

/** Connected-account balance, for reconciling against our ledger. */
export const getAccountBalance = async (accountId) => {
  const s = requireStripe();
  const balance = await s.balance.retrieve({ stripeAccount: accountId });
  const sum = (arr) => (arr ?? []).reduce((t, b) => t + b.amount, 0);
  return {
    availableCents: sum(balance.available),
    pendingCents: sum(balance.pending),
  };
};

export const isConfigured = () => Boolean(stripe());

export default {
  ensureConnectedAccount,
  createOnboardingLink,
  createDashboardLink,
  syncAccountStatus,
  profileForAccount,
  createTransfer,
  getAccountBalance,
  isConfigured,
};
