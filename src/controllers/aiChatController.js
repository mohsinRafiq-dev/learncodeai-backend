import geminiService from "../services/geminiService.js";
import AIChat from "../models/AIChat.js";

class AIChatController {
  async sendMessage(req, res) {
    try {
      const { message, context, contextId, contextTitle, contentScope } =
        req.body;

      if (!message) {
        return res.status(400).json({
          success: false,
          message: "Message is required",
        });
      }

      // Build context-aware prompt with strict scope - BEGINNER FRIENDLY
      let systemContext;
      if (context === "course" && contextTitle) {
        systemContext = `You are an AI tutor for "${contextTitle}". Use markdown formatting (##, -, **bold**). Keep answers simple, beginner-friendly, and focused only on ${contextTitle}. If asked about other topics, redirect to the course topic.${
  contentScope ? `\nReference: ${contentScope}` : ""
}`;
      } else if (context === "tutorial" && contextTitle) {
        systemContext = `You are an AI tutor for tutorial "${contextTitle}". Use markdown formatting (##, -, **bold**). Keep answers simple, beginner-friendly, and focused only on this tutorial topic. If asked about other topics, redirect to the tutorial.${
  contentScope ? `\nReference: ${contentScope}` : ""
}`;
      } else {
        systemContext = `You are an AI programming assistant. Use markdown formatting and simple language for beginners.`;
      }

      const prompt = `${systemContext}\n\nQ: ${message}\n\nAnswer concisely with markdown formatting:`;

      // Call Gemini API
      const response = await geminiService.callGemini(prompt);
      const aiResponse = geminiService.extractText(response);

      // Save to database (optional)
      try {
        await AIChat.create({
          user: req.user?._id,
          message,
          response: aiResponse,
          context: context || "general",
          contextTitle: contextTitle || "",
          contextId: contextId || "",
          contentScope: contentScope || "",
        });
      } catch (dbError) {
        console.error("Error saving chat to database:", dbError);
        // Continue even if DB save fails
      }

      res.status(200).json({
        success: true,
        data: {
          response: aiResponse,
        },
      });
    } catch (error) {
      console.error("Error in AI chat:", error);
      res.status(500).json({
        success: false,
        message: "Failed to generate AI response",
        error: error.message,
      });
    }
  }

  async clearChats(req, res) {
    try {
      const userId = req.user?._id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      // Delete all chats for the current user
      const result = await AIChat.deleteMany({ user: userId });

      res.status(200).json({
        success: true,
        message: "All chats cleared successfully",
        deletedCount: result.deletedCount,
      });
    } catch (error) {
      console.error("Error clearing chats:", error);
      res.status(500).json({
        success: false,
        message: "Failed to clear chats",
        error: error.message,
      });
    }
  }

  async getChatHistory(req, res) {
    try {
      const userId = req.user?._id;
      const { context, contextId } = req.query;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      // Build query based on filters
      let query = { user: userId };
      if (context) query.context = context;
      if (contextId) query.contextId = contextId;

      // Fetch chats and sort by creation date
      const chats = await AIChat.find(query).sort({ createdAt: 1 }).limit(50); // Limit to last 50 chats per context

      res.status(200).json({
        success: true,
        data: chats,
      });
    } catch (error) {
      console.error("Error fetching chat history:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch chat history",
        error: error.message,
      });
    }
  }
}

export default new AIChatController();

