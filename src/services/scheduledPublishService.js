import Tutorial from "../models/Tutorial.js";
import Course from "../models/Course.js";

const INTERVAL_MS = 5 * 60 * 1000; // 5 min

async function tick() {
  const now = new Date();
  try {
    const [tutorialResult, courseResult] = await Promise.all([
      Tutorial.updateMany(
        { isPublished: false, publishAt: { $lte: now, $ne: null } },
        { $set: { isPublished: true } }
      ),
      Course.updateMany(
        { isPublished: false, publishAt: { $lte: now, $ne: null } },
        { $set: { isPublished: true } }
      ),
    ]);
    if (tutorialResult.modifiedCount || courseResult.modifiedCount) {
      console.log(
        `📅 Scheduled publish: tutorials=${tutorialResult.modifiedCount}, courses=${courseResult.modifiedCount}`
      );
    }
  } catch (e) {
    console.warn("Scheduled publish tick failed:", e.message);
  }
}

let timer = null;
export function startScheduledPublishService() {
  if (timer) return;
  // Run once on startup, then on interval
  tick();
  timer = setInterval(tick, INTERVAL_MS);
  timer.unref?.();
}

export function stopScheduledPublishService() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
