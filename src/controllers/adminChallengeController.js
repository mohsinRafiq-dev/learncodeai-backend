// Admin CRUD for the DailyChallenge collection. Powers the "Coding Challenges"
// tab in the admin panel — list/create/edit/delete daily coding exercises.

import { DailyChallenge } from "../models/DailyChallenge.js";

// Helper: normalize incoming body, accepting either a string testCases JSON
// or an array. Returns null if the payload looks invalid (so the caller can
// 400 it).
const sanitizeBody = (body = {}) => {
  const out = { ...body };
  if (typeof out.testCases === "string") {
    try {
      out.testCases = JSON.parse(out.testCases);
    } catch {
      return null;
    }
  }
  if (out.testCases && !Array.isArray(out.testCases)) {
    return null;
  }
  return out;
};

// GET /api/admin/challenges?language=python&limit=50
export const listChallenges = async (req, res) => {
  try {
    const { language, difficulty, from, to } = req.query;
    const limit = Math.min(parseInt(req.query.limit) || 100, 365);
    const filter = {};
    if (language) filter.language = String(language).toLowerCase();
    if (difficulty) filter.difficulty = String(difficulty).toLowerCase();
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = String(from);
      if (to) filter.date.$lte = String(to);
    }
    const items = await DailyChallenge.find(filter)
      .sort({ date: -1 })
      .limit(limit)
      .lean();
    res.json({ success: true, count: items.length, data: items });
  } catch (err) {
    console.error("listChallenges failed:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/admin/challenges/:id
export const getChallenge = async (req, res) => {
  try {
    const doc = await DailyChallenge.findById(req.params.id).lean();
    if (!doc)
      return res
        .status(404)
        .json({ success: false, message: "Challenge not found" });
    res.json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/admin/challenges
export const createChallenge = async (req, res) => {
  try {
    const body = sanitizeBody(req.body);
    if (!body) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid testCases payload" });
    }
    if (!body.date || !body.title || !body.description || !body.language) {
      return res.status(400).json({
        success: false,
        message: "date, title, description, and language are required",
      });
    }
    const exists = await DailyChallenge.findOne({ date: body.date }).lean();
    if (exists) {
      return res.status(409).json({
        success: false,
        message: `A challenge already exists for ${body.date}. Edit it or pick another date.`,
      });
    }
    const created = await DailyChallenge.create(body);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    console.error("createChallenge failed:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/admin/challenges/:id
export const updateChallenge = async (req, res) => {
  try {
    const body = sanitizeBody(req.body);
    if (!body)
      return res
        .status(400)
        .json({ success: false, message: "Invalid testCases payload" });

    const updated = await DailyChallenge.findByIdAndUpdate(req.params.id, body, {
      new: true,
      runValidators: true,
    });
    if (!updated)
      return res
        .status(404)
        .json({ success: false, message: "Challenge not found" });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/admin/challenges/:id
export const deleteChallenge = async (req, res) => {
  try {
    const result = await DailyChallenge.findByIdAndDelete(req.params.id);
    if (!result)
      return res
        .status(404)
        .json({ success: false, message: "Challenge not found" });
    res.json({ success: true, message: "Challenge deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export default {
  listChallenges,
  getChallenge,
  createChallenge,
  updateChallenge,
  deleteChallenge,
};
