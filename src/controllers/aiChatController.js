import crypto from "crypto";
import geminiService from "../services/geminiService.js";
import AIChat from "../models/AIChat.js";

// Rough token estimate (4 chars ≈ 1 token for English/code)
const estimateTokens = (text = "") => Math.ceil((text || "").length / 4);

const newConversationId = () => crypto.randomBytes(8).toString("hex");

class AIChatController {
  async sendMessage(req, res) {
    try {
      const { message, context, contextId, contextTitle, contentScope } = req.body;
      let { conversationId } = req.body;

      if (!message) {
        return res.status(400).json({
          success: false,
          message: "Message is required",
        });
      }

      if (!conversationId) conversationId = newConversationId();

      // Build context-aware system prompt
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

      // Pull last few turns from this conversation for context
      let priorTurns = [];
      try {
        priorTurns = await AIChat.find({
          user: req.user?._id,
          conversationId,
        })
          .sort({ createdAt: -1 })
          .limit(5)
          .lean();
        priorTurns.reverse();
      } catch {
        priorTurns = [];
      }

      const history = priorTurns
        .map((t) => `Q: ${t.message}\nA: ${t.response}`)
        .join("\n\n");

      const prompt = history
        ? `${systemContext}\n\n${history}\n\nQ: ${message}\n\nAnswer concisely with markdown formatting:`
        : `${systemContext}\n\nQ: ${message}\n\nAnswer concisely with markdown formatting:`;

      const response = await geminiService.callGemini(prompt);
      const aiResponse = geminiService.extractText(response);

      const promptTokens = estimateTokens(prompt);
      const responseTokens = estimateTokens(aiResponse);

      try {
        await AIChat.create({
          user: req.user?._id,
          conversationId,
          message,
          response: aiResponse,
          context: context || "general",
          contextTitle: contextTitle || "",
          contextId: contextId || "",
          contentScope: contentScope || "",
          promptTokens,
          responseTokens,
        });
      } catch (dbError) {
        console.error("Error saving chat to database:", dbError);
      }

      res.status(200).json({
        success: true,
        data: {
          response: aiResponse,
          conversationId,
          tokens: { prompt: promptTokens, response: responseTokens },
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
      const { conversationId } = req.query;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      const filter = { user: userId };
      if (conversationId) filter.conversationId = conversationId;

      const result = await AIChat.deleteMany(filter);

      res.status(200).json({
        success: true,
        message: conversationId
          ? "Conversation cleared"
          : "All chats cleared successfully",
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
      const { context, contextId, conversationId } = req.query;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      let query = { user: userId };
      if (context) query.context = context;
      if (contextId) query.contextId = contextId;
      if (conversationId) query.conversationId = conversationId;

      const chats = await AIChat.find(query).sort({ createdAt: 1 }).limit(100);

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

  // GET /api/aichat/usage — current user's token usage in last N days
  async getUsage(req, res) {
    try {
      const userId = req.user?._id;
      const days = Math.min(parseInt(req.query.days) || 30, 365);
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const result = await AIChat.aggregate([
        { $match: { user: userId, createdAt: { $gte: since } } },
        {
          $group: {
            _id: null,
            messages: { $sum: 1 },
            promptTokens: { $sum: "$promptTokens" },
            responseTokens: { $sum: "$responseTokens" },
          },
        },
      ]);

      const summary = result[0] || { messages: 0, promptTokens: 0, responseTokens: 0 };
      summary.totalTokens = (summary.promptTokens || 0) + (summary.responseTokens || 0);
      summary.rangeDays = days;

      res.status(200).json({ success: true, data: summary });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch usage",
        error: error.message,
      });
    }
  }
}

export default new AIChatController();
