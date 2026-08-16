#!/usr/bin/env node
//
// Backfills Course.status and Course.ownership for courses that predate them.
//
// The lifecycle state machine added `status`, which defaults to "draft". Every
// course created before that therefore reads as a draft regardless of its
// legacy isPublished flag, so anything filtering on status — the marketplace
// catalogue in particular — sees nothing.
//
// Idempotent: only touches documents whose status disagrees with isPublished,
// or which have no ownership set.
//
// Usage:
//   node scripts/migrate-course-status.js --dry-run
//   node scripts/migrate-course-status.js

import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";

const DRY_RUN = process.argv.includes("--dry-run");

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const { default: Course } = await import("../src/models/Course.js");

  console.log(`\nCourse status backfill ${DRY_RUN ? "(DRY RUN)" : ""}\n`);

  const all = await Course.find({})
    .select("title isPublished status ownership instructor priceCents isArchived")
    .lean();

  console.log(`courses: ${all.length}`);
  const byStatus = all.reduce((a, c) => {
    a[c.status ?? "(unset)"] = (a[c.status ?? "(unset)"] ?? 0) + 1;
    return a;
  }, {});
  console.log(`current status spread: ${JSON.stringify(byStatus)}\n`);

  // A course flagged published under the old boolean but sitting at draft under
  // the new field is the case this exists to correct.
  const needsPublish = all.filter((c) => c.isPublished === true && c.status !== "published");
  // Courses with no ownership are the platform's own curriculum: they predate
  // the marketplace and were authored by the team, not by a creator.
  const needsOwnership = all.filter((c) => !c.ownership);

  console.log(`to mark published : ${needsPublish.length}`);
  console.log(`to set ownership  : ${needsOwnership.length}`);

  for (const c of needsPublish.slice(0, 10)) {
    console.log(`  ${c.title?.slice(0, 60)}  ${c.status} -> published`);
  }
  if (needsPublish.length > 10) console.log(`  … and ${needsPublish.length - 10} more`);

  if (DRY_RUN) {
    console.log("\nNo changes written.\n");
    await mongoose.disconnect();
    return;
  }

  let published = 0;
  let owned = 0;

  if (needsPublish.length) {
    const res = await Course.updateMany(
      { isPublished: true, status: { $ne: "published" } },
      // publishedAt is set from createdAt where missing, so the catalogue's
      // "newest" sort does not put every legacy course at the top today.
      [
        {
          $set: {
            status: "published",
            publishedAt: { $ifNull: ["$publishedAt", "$createdAt"] },
          },
        },
      ]
    );
    published = res.modifiedCount;
  }

  if (needsOwnership.length) {
    const res = await Course.updateMany(
      { ownership: { $exists: false } },
      { $set: { ownership: "platform" } }
    );
    owned = res.modifiedCount;
  }

  console.log(`\nmarked published : ${published}`);
  console.log(`ownership set    : ${owned}`);

  const after = await Course.aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }]);
  console.log(`final status spread: ${JSON.stringify(Object.fromEntries(after.map((r) => [r._id, r.n])))}\n`);

  await mongoose.disconnect();
};

run().catch(async (err) => {
  console.error("\nMigration failed:", err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
