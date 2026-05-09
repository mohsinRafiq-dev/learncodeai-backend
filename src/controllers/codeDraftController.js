import CodeDraft from "../models/CodeDraft.js";

// GET /api/drafts — all drafts for current user
export const getMyDrafts = async (req, res) => {
  try {
    const drafts = await CodeDraft.find({ user: req.user._id }).sort({ updatedAt: -1 });
    res.status(200).json({ success: true, data: drafts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/drafts/:language — single draft for current user/language
export const getDraft = async (req, res) => {
  try {
    const { language } = req.params;
    const draft = await CodeDraft.findOne({ user: req.user._id, language });
    res.status(200).json({ success: true, data: draft });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/drafts/:language — autosave (upsert)
export const saveDraft = async (req, res) => {
  try {
    const { language } = req.params;
    const { code = "", input = "" } = req.body;
    if (!["python", "javascript", "cpp"].includes(language)) {
      return res.status(400).json({ success: false, message: "Invalid language" });
    }
    const draft = await CodeDraft.findOneAndUpdate(
      { user: req.user._id, language },
      { code, input },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.status(200).json({ success: true, data: draft });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/drafts/:language
export const deleteDraft = async (req, res) => {
  try {
    const { language } = req.params;
    await CodeDraft.deleteOne({ user: req.user._id, language });
    res.status(200).json({ success: true, message: "Draft deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
