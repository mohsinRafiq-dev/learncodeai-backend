import CodeSnippet from "../models/CodeSnippet.js";

// Get all snippets for the authenticated user
export const getUserSnippets = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const snippets = await CodeSnippet.find({ owner: userId })
      .sort({ updatedAt: -1 })
      .select('title language code createdAt updatedAt');

    res.status(200).json({
      success: true,
      data: snippets,
    });
  } catch (error) {
    console.error("Error fetching snippets:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching snippets",
      error: error.message,
    });
  }
};

// Get a single snippet by ID
export const getSnippetById = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const snippet = await CodeSnippet.findOne({ _id: id, owner: userId });

    if (!snippet) {
      return res.status(404).json({
        success: false,
        message: "Snippet not found",
      });
    }

    res.status(200).json({
      success: true,
      data: snippet,
    });
  } catch (error) {
    console.error("Error fetching snippet:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching snippet",
      error: error.message,
    });
  }
};

// Create a new snippet
export const createSnippet = async (req, res) => {
  try {
    const userId = req.user._id;
    const { title, language, code, output } = req.body;

    if (!language || !code) {
      return res.status(400).json({
        success: false,
        message: "Language and code are required",
      });
    }

    const snippet = await CodeSnippet.create({
      owner: userId,
      title: title || "Untitled Code",
      language,
      code,
      output: output || "",
    });

    res.status(201).json({
      success: true,
      message: "Snippet saved successfully",
      data: snippet,
    });
  } catch (error) {
    console.error("Error creating snippet:", error);
    res.status(500).json({
      success: false,
      message: "Error saving snippet",
      error: error.message,
    });
  }
};

// Update a snippet
export const updateSnippet = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { title, language, code, output } = req.body;

    const snippet = await CodeSnippet.findOne({ _id: id, owner: userId });

    if (!snippet) {
      return res.status(404).json({
        success: false,
        message: "Snippet not found",
      });
    }

    if (title !== undefined) snippet.title = title;
    if (language !== undefined) snippet.language = language;
    if (code !== undefined) snippet.code = code;
    if (output !== undefined) snippet.output = output;

    await snippet.save();

    res.status(200).json({
      success: true,
      message: "Snippet updated successfully",
      data: snippet,
    });
  } catch (error) {
    console.error("Error updating snippet:", error);
    res.status(500).json({
      success: false,
      message: "Error updating snippet",
      error: error.message,
    });
  }
};

// Delete a snippet
export const deleteSnippet = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const snippet = await CodeSnippet.findOneAndDelete({ _id: id, owner: userId });

    if (!snippet) {
      return res.status(404).json({
        success: false,
        message: "Snippet not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Snippet deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting snippet:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting snippet",
      error: error.message,
    });
  }
};

