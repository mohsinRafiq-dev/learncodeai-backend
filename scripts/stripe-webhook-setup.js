#!/usr/bin/env node
//
// Creates (or repairs) the Stripe webhook endpoint and prints its signing
// secret.
//
// Doing this through the API rather than the dashboard means the subscribed
// event list is defined in code next to the handler that consumes it. A
// dashboard-created endpoint drifts: someone adds a handler case and forgets to
// subscribe the event, and the feature silently never fires.
//
// Idempotent: an existing endpoint for the same URL is updated in place. Stripe
// only reveals a signing secret at creation time, so if the endpoint already
// exists and the secret is unknown, this recreates it (printing why).
//
// Usage:
//   node scripts/stripe-webhook-setup.js https://learncodeai.duckdns.org
//   node scripts/stripe-webhook-setup.js --list

import dotenv from "dotenv";
dotenv.config();
import Stripe from "stripe";

// Every event the billing + marketplace handlers act on. Keep in step with
// billingController.handleWebhook and the Connect handlers.
const EVENTS = [
  // Subscriptions and one-off purchases
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.payment_failed",
  "invoice.paid",
  // Refunds must revoke entitlements
  "charge.refunded",
  "charge.dispute.created",
  // Connect: creator onboarding progress and payout outcomes
  "account.updated",
  "transfer.created",
  "transfer.reversed",
  "payout.paid",
  "payout.failed",
];

if (!process.env.STRIPE_SECRET_KEY) {
  console.error("STRIPE_SECRET_KEY is not set.");
  process.exit(1);
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const listOnly = process.argv.includes("--list");
const baseArg = process.argv.find((a) => a.startsWith("http"));

const run = async () => {
  if (listOnly) {
    const eps = await stripe.webhookEndpoints.list({ limit: 20 });
    if (!eps.data.length) return console.log("No webhook endpoints configured.");
    for (const ep of eps.data) {
      console.log(`\n${ep.url}`);
      console.log(`  id      : ${ep.id}`);
      console.log(`  status  : ${ep.status}`);
      console.log(`  events  : ${ep.enabled_events.length}`);
    }
    return;
  }

  const base = (baseArg || process.env.PUBLIC_BACKEND_URL || "").replace(/\/+$/, "");
  if (!base) {
    console.error(
      "Pass the public backend base URL, e.g.\n" +
        "  node scripts/stripe-webhook-setup.js https://learncodeai.duckdns.org"
    );
    process.exit(1);
  }
  if (!base.startsWith("https://")) {
    // Stripe will not deliver to plain HTTP, so fail here rather than let it
    // look configured and never fire.
    console.error(`Stripe requires HTTPS. Got: ${base}`);
    process.exit(1);
  }

  const url = `${base}/api/billing/webhook`;
  console.log(`\nTarget: ${url}\n`);

  const existing = (await stripe.webhookEndpoints.list({ limit: 100 })).data.find(
    (e) => e.url === url
  );

  let endpoint;
  let secret = null;

  if (existing) {
    console.log(`Found existing endpoint ${existing.id}`);
    endpoint = await stripe.webhookEndpoints.update(existing.id, {
      enabled_events: EVENTS,
      disabled: false,
    });
    console.log("Updated its event subscriptions.");
    console.log(
      "\nNOTE: Stripe only reveals a signing secret when the endpoint is\n" +
        "created. If STRIPE_WEBHOOK_SECRET is not already set, delete this\n" +
        "endpoint in the dashboard and re-run to get a fresh secret."
    );
  } else {
    endpoint = await stripe.webhookEndpoints.create({
      url,
      enabled_events: EVENTS,
      description: "LearnCode AI — billing and marketplace events",
    });
    secret = endpoint.secret;
    console.log(`Created endpoint ${endpoint.id}`);
  }

  console.log(`\nSubscribed to ${endpoint.enabled_events.length} events:`);
  for (const e of endpoint.enabled_events) console.log(`  ${e}`);

  if (secret) {
    console.log("\nAdd this to .env:\n");
    console.log(`STRIPE_WEBHOOK_SECRET=${secret}`);
    console.log("\nThen restart: pm2 restart learncodeai-backend --update-env");
  }
};

run().catch((err) => {
  console.error("\nWebhook setup failed:", err.message);
  process.exit(1);
});
