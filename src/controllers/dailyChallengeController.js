import { DailyChallenge, DailyChallengeAttempt } from "../models/DailyChallenge.js";
import codeExecutorWSService from "../services/codeExecutorWSService.js";
import gamificationService from "../services/gamificationService.js";

const todayKey = () => new Date().toISOString().slice(0, 10);

// GET /api/daily-challenge/today
export const getTodayChallenge = async (req, res) => {
  try {
    const date = todayKey();
    const challenge = await DailyChallenge.findOne({ date });
    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: "No daily challenge available for today.",
      });
    }
    let attempt = null;
    if (req.user?._id) {
      attempt = await DailyChallengeAttempt.findOne({
        user: req.user._id,
        challengeDate: date,
      }).lean();
    }
    // Don't expose the solution
    const { solution: _solution, ...safe } = challenge.toObject();
    void _solution;
    res.status(200).json({ success: true, data: { challenge: safe, attempt } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/daily-challenge/submit
export const submitChallenge = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: "Code is required" });
    }
    const date = todayKey();
    const challenge = await DailyChallenge.findOne({ date });
    if (!challenge) {
      return res.status(404).json({ success: false, message: "No challenge today." });
    }

    const existing = await DailyChallengeAttempt.findOne({
      user: req.user._id,
      challengeDate: date,
    });
    if (existing && existing.passed) {
      return res.status(400).json({
        success: false,
        message: "Already completed today's challenge.",
      });
    }

    // Run all test cases
    let allPassed = challenge.testCases.length > 0;
    const results = [];
    for (const tc of challenge.testCases) {
      const r = await codeExecutorWSService.executeCode(
        code,
        challenge.language,
        tc.input || ""
      );
      const out = (r?.output || r?.stdout || "").trim();
      const expected = (tc.expectedOutput || "").trim();
      const passed = out === expected;
      results.push({
        input: tc.input,
        expected,
        actual: out,
        passed,
        error: r?.error || r?.stderr || null,
      });
      if (!passed) allPassed = false;
    }

    let pointsAwarded = 0;
    if (allPassed) {
      pointsAwarded = challenge.points;
      // Award streak bonus if user solved yesterday too
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      const yesterdayAttempt = await DailyChallengeAttempt.findOne({
        user: req.user._id,
        challengeDate: yesterday,
        passed: true,
      });
      if (yesterdayAttempt) pointsAwarded += challenge.bonusPointsForStreak;

      await gamificationService
        .addPoints(req.user._id, pointsAwarded, "daily_challenge", challenge._id)
        .catch(() => {});
      await gamificationService.updateStreak(req.user._id).catch(() => {});
    }

    const attempt = await DailyChallengeAttempt.findOneAndUpdate(
      { user: req.user._id, challengeDate: date },
      {
        $set: {
          challenge: challenge._id,
          code,
          passed: allPassed,
          pointsAwarded,
        },
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      data: {
        passed: allPassed,
        pointsAwarded,
        attempt,
        results,
      },
    });
  } catch (error) {
    console.error("Daily challenge submit error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/daily-challenge/history
export const getHistory = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 30, 90);
    const attempts = await DailyChallengeAttempt.find({ user: req.user._id })
      .sort({ challengeDate: -1 })
      .limit(limit)
      .populate("challenge", "title language difficulty")
      .lean();
    res.status(200).json({ success: true, data: attempts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/admin/daily-challenge — admin only
export const upsertChallenge = async (req, res) => {
  try {
    const { date = todayKey(), title, description, language, difficulty, starterCode, solution, testCases, points, bonusPointsForStreak } = req.body;
    if (!title || !description || !language) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }
    const challenge = await DailyChallenge.findOneAndUpdate(
      { date },
      { title, description, language, difficulty, starterCode, solution, testCases, points, bonusPointsForStreak },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.status(200).json({ success: true, data: challenge });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
