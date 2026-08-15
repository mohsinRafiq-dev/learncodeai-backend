#!/usr/bin/env node
//
// Creates the Stripe products and prices that match config/monetization.js,
// and prints the env lines to paste into .env.
//
// Hand-creating prices in the dashboard is where pricing drifts away from the
// code: the plan says $9 and the price object says $6, and nobody notices until
// a customer is charged the wrong amount. This derives everything from the plan
// catalogue so the two cannot disagree.
//
// Idempotent: products are looked up by a stable metadata key, so re-running
// updates rather than duplicating. Prices are immutable in Stripe, so a changed
// amount creates a new price and archives the old one.
//
// Usage:
//   node scripts/stripe-bootstrap.js            # create/verify
//   node scripts/stripe-bootstrap.js --dry-run  # show what would happen

import dotenv from "dotenv";
dotenv.config();

import Stripe from "stripe";
import { PLANS, PLAN, CURRENCY } from "../src/config/monetization.js";

const DRY_RUN = process.argv.includes("--dry-run");

if (!process.env.STRIPE_SECRET_KEY) {
  console.error(
    "STRIPE_SECRET_KEY is not set.\n" +
      "Get your test key from https://dashboard.stripe.com/test/apikeys\n" +
      "(make sure Test mode is on — the key starts with sk_test_)"
  );
  process.exit(1);
}

if (!process.env.STRIPE_SECRET_KEY.startsWith("sk_test_")) {
  console.error(
    "Refusing to run: STRIPE_SECRET_KEY is not a test key.\n" +
      "This script creates products and prices; run it against test mode only."
  );
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Stable keys so re-runs find the existing product instead of making another.
const CATALOGUE = [
  {
    key: "pro_monthly",
    name: "LearnCode AI Pro — Monthly",
    description: "Full access to all tutorials, courses, certificates and 2,000 AI credits per month.",
    amount: PLANS[PLAN.PRO].priceCents,
    recurring: { interval: "month" },
    envVar: "STRIPE_PRICE_PRO_MONTHLY",
  },
  {
    key: "pro_yearly",
    name: "LearnCode AI Pro — Yearly",
    description: "Pro, billed annually. Two months free versus monthly.",
    amount: PLANS[PLAN.PRO].yearlyPriceCents,
    recurring: { interval: "year" },
    envVar: "STRIPE_PRICE_PRO_YEARLY",
  },
  {
    key: "lifetime",
    name: "LearnCode AI Lifetime",
    description: "One-time purchase. Pro access that never expires.",
    amount: PLANS[PLAN.LIFETIME].priceCents,
    recurring: null,
    envVar: "STRIPE_PRICE_LIFETIME",
  },
];

const findProductByKey = async (key) => {
  // search is the only way to query by metadata; it is eventually consistent,
  // so fall back to a list scan when it returns nothing.
  try {
    const res = await stripe.products.search({
      query: `metadata['learncodeai_key']:'${key}'`,
      limit: 1,
    });
    if (res.data.length) return res.data[0];
  } catch {
    // search unavailable on some account types — fall through
  }
  const all = await stripe.products.list({ limit: 100, active: true });
  return all.data.find((p) => p.metadata?.learncodeai_key === key) ?? null;
};

const findPrice = async (productId, amount, recurring) => {
  const prices = await stripe.prices.list({ product: productId, active: true, limit: 100 });
  return (
    prices.data.find(
      (p) =>
        p.unit_amount === amount &&
        p.currency === CURRENCY &&
        (recurring ? p.recurring?.interval === recurring.interval : !p.recurring)
    ) ?? null
  );
};

const run = async () => {
  console.log(`\nStripe bootstrap ${DRY_RUN ? "(dry run)" : ""}`);
  console.log(`Account: ${(await stripe.accounts.retrieve()).id}\n`);

  const envLines = [];

  for (const item of CATALOGUE) {
    const label = `${item.name} — $${(item.amount / 100).toFixed(2)}${
      item.recurring ? `/${item.recurring.interval}` : " once"
    }`;
    console.log(label);

    if (DRY_RUN) {
      console.log("   would create/verify product and price\n");
      continue;
    }

    let product = await findProductByKey(item.key);
    if (product) {
      console.log(`   product exists: ${product.id}`);
      if (product.name !== item.name || product.description !== item.description) {
        product = await stripe.products.update(product.id, {
          name: item.name,
          description: item.description,
        });
        console.log("   product details updated");
      }
    } else {
      product = await stripe.products.create({
        name: item.name,
        description: item.description,
        metadata: { learncodeai_key: item.key },
      });
      console.log(`   product created: ${product.id}`);
    }

    let price = await findPrice(product.id, item.amount, item.recurring);
    if (price) {
      console.log(`   price exists:   ${price.id}`);
    } else {
      // Prices are immutable, so a changed amount means a new price. The old
      // one is archived rather than deleted so existing subscriptions on it
      // keep renewing at the price the customer agreed to.
      const stale = await stripe.prices.list({ product: product.id, active: true, limit: 100 });
      for (const old of stale.data) {
        await stripe.prices.update(old.id, { active: false });
        console.log(`   archived old price: ${old.id}`);
      }
      price = await stripe.prices.create({
        product: product.id,
        unit_amount: item.amount,
        currency: CURRENCY,
        ...(item.recurring ? { recurring: item.recurring } : {}),
        metadata: { learncodeai_key: item.key },
      });
      console.log(`   price created:  ${price.id}`);
    }

    envLines.push(`${item.envVar}=${price.id}`);
    console.log();
  }

  // Connect is required for the marketplace half of the model.
  console.log("Checking Stripe Connect...");
  try {
    const acct = await stripe.accounts.create({ type: "express" });
    await stripe.accounts.del(acct.id);
    console.log("   Connect: ENABLED\n");
  } catch (err) {
    console.log(`   Connect: NOT USABLE — ${err.message.split("\n")[0]}`);
    console.log(
      "   Enable it at https://dashboard.stripe.com/test/connect/overview\n"
    );
  }

  if (!DRY_RUN) {
    console.log("Add these to .env:\n");
    console.log(envLines.join("\n"));
    console.log(
      "\nThen create a webhook endpoint pointing at:\n" +
        `  ${process.env.FRONTEND_URL ? "" : "(set FRONTEND_URL first) "}` +
        "https://<your-backend-host>/api/billing/webhook\n" +
        "listening for: checkout.session.completed, customer.subscription.*,\n" +
        "invoice.payment_failed, charge.refunded, account.updated,\n" +
        "transfer.created, transfer.failed\n" +
        "and put its signing secret in STRIPE_WEBHOOK_SECRET.\n"
    );
  }
};

run().catch((err) => {
  console.error("\nBootstrap failed:", err.message);
  process.exit(1);
});
