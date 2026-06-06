// Seed realistic-looking ErrorLog samples so the admin analytics charts
// render properly during the FYP demo. Spreads roughly 60 docs across the
// last 30 days, weighted toward common error types.
//
// Usage:
//   node scripts/seedErrorLogs.js          # only seeds if collection is empty
//   node scripts/seedErrorLogs.js --force  # wipes + reseeds

import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import ErrorLog from "../src/models/ErrorLog.js";
import User from "../src/models/User.js";

const FORCE = process.argv.includes("--force");

const SAMPLES = [
  // [language, errorType, errorMessage]
  ["python", "syntax", "SyntaxError: invalid syntax (<string>, line 4)"],
  ["python", "syntax", "IndentationError: expected an indented block"],
  ["python", "runtime", "NameError: name 'x' is not defined"],
  ["python", "runtime", "TypeError: unsupported operand type(s) for +: 'int' and 'str'"],
  ["python", "runtime", "ZeroDivisionError: division by zero"],
  ["python", "runtime", "IndexError: list index out of range"],
  ["python", "runtime", "KeyError: 'username'"],
  ["python", "timeout", "Execution timed out after 10s"],
  ["javascript", "syntax", "SyntaxError: Unexpected token ')'"],
  ["javascript", "runtime", "ReferenceError: foo is not defined"],
  ["javascript", "runtime", "TypeError: Cannot read properties of undefined (reading 'length')"],
  ["javascript", "runtime", "RangeError: Maximum call stack size exceeded"],
  ["javascript", "timeout", "Execution timed out after 10s"],
  ["cpp", "compilation", "error: 'cout' was not declared in this scope"],
  ["cpp", "compilation", "error: expected ';' before 'return'"],
  ["cpp", "compilation", "error: 'string' was not declared in this scope (missing #include <string>)"],
  ["cpp", "runtime", "Segmentation fault (core dumped)"],
  ["cpp", "runtime", "terminate called after throwing an instance of 'std::out_of_range'"],
  ["cpp", "timeout", "Execution timed out after 10s"],
];

// Hand-tuned weights so the chart looks realistic (python beats cpp etc).
const PICK_WEIGHTS = [
  3, 2, 4, 3, 2, 3, 2, 1, // python (20)
  2, 4, 3, 2, 1,          // javascript (12)
  3, 3, 2, 2, 1, 1,       // cpp (12)
];

const weightedPick = () => {
  const total = PICK_WEIGHTS.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < PICK_WEIGHTS.length; i++) {
    r -= PICK_WEIGHTS[i];
    if (r <= 0) return SAMPLES[i];
  }
  return SAMPLES[0];
};

const run = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI not set in .env");

  await mongoose.connect(uri);
  console.log("📡 Connected to MongoDB");

  const existing = await ErrorLog.countDocuments();
  if (existing > 0 && !FORCE) {
    console.log(`⚠️  ${existing} error logs already exist. Re-run with --force to wipe.`);
    await mongoose.disconnect();
    return;
  }
  if (FORCE && existing > 0) {
    const del = await ErrorLog.deleteMany({});
    console.log(`🧹 Removed ${del.deletedCount} existing error logs.`);
  }

  // Attach each error to a random real user for realism (if any exist)
  const userCount = await User.countDocuments();
  const sampleUsers = userCount
    ? await User.find().limit(10).select("_id").lean()
    : [];

  const now = Date.now();
  const days = 30;
  const docs = [];
  for (let day = 0; day < days; day++) {
    const dayErrors = 2 + Math.floor(Math.random() * 4); // 2..5 per day
    for (let i = 0; i < dayErrors; i++) {
      const [language, errorType, errorMessage] = weightedPick();
      const minutesAgo = day * 24 * 60 + Math.floor(Math.random() * 24 * 60);
      const occurredAt = new Date(now - minutesAgo * 60 * 1000);
      const user = sampleUsers.length
        ? sampleUsers[Math.floor(Math.random() * sampleUsers.length)]._id
        : null;
      docs.push({
        user,
        language,
        errorType,
        errorMessage,
        snippet: "(sample code)",
        occurredAt,
      });
    }
  }

  const created = await ErrorLog.insertMany(docs);
  console.log(`✅ Inserted ${created.length} sample error logs.`);

  const byType = await ErrorLog.aggregate([
    { $group: { _id: "$errorType", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
  console.log("\n📊 By type:");
  byType.forEach((r) => console.log(`  ${r._id.padEnd(12)} ${r.count}`));

  const byLang = await ErrorLog.aggregate([
    { $group: { _id: "$language", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
  console.log("\n📊 By language:");
  byLang.forEach((r) => console.log(`  ${r._id.padEnd(12)} ${r.count}`));

  await mongoose.disconnect();
  console.log("\n✨ Done.");
};

run().catch((e) => {
  console.error("seedErrorLogs failed:", e);
  process.exit(1);
});
