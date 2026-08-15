#!/usr/bin/env node
//
// Backfills the Entitlement collection from the legacy access fields.
//
// /api/billing/me and every paywall now resolve access through Entitlement
// rather than User.purchasedCourses[]. Without this backfill, anyone who bought
// a course before the change would silently lose it — so this must run BEFORE
// the new code is deployed, not after.
//
// Idempotent: Entitlement.grant reuses an existing row for the same
// (user, resource, source), so re-running does not duplicate. Safe to run
// repeatedly if a deploy is retried.
//
// Usage:
//   node scripts/migrate-entitlements.js --dry-run   # report only, no writes
//   node scripts/migrate-entitlements.js             # apply
//   node scripts/migrate-entitlements.js --verify    # check the result

import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";

const DRY_RUN = process.argv.includes("--dry-run");
const VERIFY = process.argv.includes("--verify");

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  const { default: User } = await import("../src/models/User.js");
  const { default: Course } = await import("../src/models/Course.js");
  const { default: Entitlement } = await import("../src/models/Entitlement.js");

  console.log(`\nEntitlement backfill ${DRY_RUN ? "(DRY RUN — no writes)" : ""}\n`);

  if (VERIFY) {
    const [users, ents, byS, orphans] = await Promise.all([
      User.countDocuments(),
      Entitlement.countDocuments(),
      Entitlement.aggregate([{ $group: { _id: "$source", n: { $sum: 1 } } }]),
      // An entitlement pointing at a course that no longer exists would
      // grant access to nothing and break the course page.
      Entitlement.aggregate([
        { $match: { resourceType: "course" } },
        { $lookup: { from: "courses", localField: "resource", foreignField: "_id", as: "c" } },
        { $match: { c: { $size: 0 } } },
        { $count: "n" },
      ]),
    ]);
    console.log(`users               : ${users}`);
    console.log(`entitlements        : ${ents}`);
    console.log(`  by source         : ${byS.map((s) => `${s._id}=${s.n}`).join(", ") || "none"}`);
    console.log(`dangling (no course): ${orphans[0]?.n ?? 0}`);
    await mongoose.disconnect();
    return;
  }

  // ---- Survey first, so the report is meaningful even in a dry run ----
  const withPurchases = await User.find({
    purchasedCourses: { $exists: true, $ne: [] },
  })
    .select("email purchasedCourses")
    .lean();

  const subscribers = await User.find({
    subscriptionTier: { $in: ["pro", "lifetime"] },
  })
    .select("email subscriptionTier subscriptionStatus subscriptionExpiresAt")
    .lean();

  console.log(`users with legacy purchases : ${withPurchases.length}`);
  console.log(`users on a paid tier        : ${subscribers.length}`);

  const totalPurchases = withPurchases.reduce(
    (n, u) => n + (u.purchasedCourses?.length ?? 0),
    0
  );
  console.log(`legacy course purchases     : ${totalPurchases}\n`);

  if (withPurchases.length === 0 && subscribers.length === 0) {
    console.log("Nothing to migrate.\n");
    await mongoose.disconnect();
    return;
  }

  let granted = 0;
  let skipped = 0;
  let missing = 0;

  // ---- Course purchases ----
  for (const user of withPurchases) {
    for (const courseId of user.purchasedCourses ?? []) {
      // A purchase pointing at a deleted course cannot be honoured, and
      // creating the row anyway would leave a dangling entitlement.
      const exists = await Course.exists({ _id: courseId });
      if (!exists) {
        console.log(`  ! ${user.email}: course ${courseId} no longer exists — skipped`);
        missing += 1;
        continue;
      }

      if (DRY_RUN) {
        granted += 1;
        continue;
      }

      const before = await Entitlement.countDocuments({
        user: user._id,
        resource: courseId,
        resourceType: "course",
      });

      await Entitlement.grant({
        user: user._id,
        resourceType: "course",
        resource: courseId,
        // No Order exists for these — they predate order tracking — so the
        // provenance is recorded honestly as a migrated grant rather than
        // inventing a purchase record.
        source: "grant",
        grantReason: "Migrated from User.purchasedCourses on 2026-08-16",
      });

      const after = await Entitlement.countDocuments({
        user: user._id,
        resource: courseId,
        resourceType: "course",
      });
      if (after > before) granted += 1;
      else skipped += 1;
    }
  }

  // ---- Subscriptions ----
  // A platform-wide entitlement makes the subscriber's access explicit and
  // auditable, rather than implied only by a tier field.
  let subGranted = 0;
  let subSkipped = 0;

  for (const user of subscribers) {
    const isLifetime = user.subscriptionTier === "lifetime";
    const active = isLifetime || ["active", "trialing"].includes(user.subscriptionStatus);
    if (!active) {
      subSkipped += 1;
      continue;
    }

    if (DRY_RUN) {
      subGranted += 1;
      continue;
    }

    const before = await Entitlement.countDocuments({
      user: user._id,
      resourceType: "platform",
    });

    await Entitlement.grant({
      user: user._id,
      resourceType: "platform",
      resource: null,
      source: "subscription",
      // Lifetime never expires; Pro carries the period end so the entitlement
      // lapses on its own if a webhook is ever missed.
      expiresAt: isLifetime ? null : user.subscriptionExpiresAt ?? null,
    });

    const after = await Entitlement.countDocuments({
      user: user._id,
      resourceType: "platform",
    });
    if (after > before) subGranted += 1;
    else subSkipped += 1;
  }

  console.log("\n--- result ---");
  console.log(`course entitlements ${DRY_RUN ? "to create" : "created"} : ${granted}`);
  if (!DRY_RUN) console.log(`already present                     : ${skipped}`);
  console.log(`skipped (course deleted)            : ${missing}`);
  console.log(`platform entitlements ${DRY_RUN ? "to create" : "created"}: ${subGranted}`);
  if (!DRY_RUN) console.log(`already present                     : ${subSkipped}`);

  if (DRY_RUN) {
    console.log("\nNo changes were written. Re-run without --dry-run to apply.\n");
  } else {
    console.log("\nDone. Verify with: node scripts/migrate-entitlements.js --verify\n");
  }

  await mongoose.disconnect();
};

run().catch(async (err) => {
  console.error("\nMigration failed:", err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
