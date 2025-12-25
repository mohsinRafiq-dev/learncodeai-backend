import CodeChat from '../models/CodeChat.js';
import geminiService from '../services/geminiService.js';

class CodeChatController {
  async sendMessage(req, res) {
    try {
      const { message, messageType, code, language, error, problems } = req.body;
      
      if (!message) {
        return res.status(400).json({
          success: false,
          message: 'Message is required'
        });
      }

      // Build context-aware prompt for code editor AI
      let systemContext = `You are an AI coding tutor. Use markdown formatting (##, -, **bold**). Keep answers concise, beginner-friendly, and focus on teaching.`;

      let contextInfo = '';
      if (code && code.trim()) {
        contextInfo += `\n\nUser's current code (${language}):\n\`\`\`${language}\n${code}\n\`\`\``;
      }
      if (error) {
        contextInfo += `\n\nCurrent error: ${error}`;
      }
      if (problems && problems.length > 0) {
        const problemsText = problems.map(p => `Line ${p.line}: ${p.message}`).join(', ');
        contextInfo += `\n\nCode problems: ${problemsText}`;
      }

      const prompt = `${systemContext}${contextInfo}\n\nQ: ${message}\n\nAnswer concisely:`;

      // Call Gemini API
      const response = await geminiService.callGemini(prompt);
      const aiResponse = geminiService.extractText(response);

      // Save to database
      try {
        await CodeChat.create({
          user: req.user?._id,
          message,
          response: aiResponse,
          messageType: messageType || 'question',
          code: code || '',
          language: language || 'python',
          error: error || '',
          problems: problems || []
        });
      } catch (dbError) {
        console.error('Error saving code chat to database:', dbError);
        // Don't fail the request if saving fails
      }

      res.status(200).json({
        success: true,
        data: {
          response: aiResponse
        }
      });
    } catch (error) {
      console.error('Error in code chat controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process message',
        error: error.message
      });
    }
  }

  async getChatHistory(req, res) {
    try {
      const userId = req.user?._id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      // Fetch chats and sort by creation date
      const chats = await CodeChat.find({ user: userId })
        .sort({ createdAt: 1 })
        .limit(100); // Limit to last 100 chats

      res.status(200).json({
        success: true,
        data: chats
      });
    } catch (error) {
      console.error('Error fetching code chat history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch code chat history',
        error: error.message
      });
    }
  }

  async clearChats(req, res) {
    try {
      const userId = req.user?._id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      await CodeChat.deleteMany({ user: userId });

      res.status(200).json({
        success: true,
        message: 'Code chat history cleared successfully'
      });
    } catch (error) {
      console.error('Error clearing code chat history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to clear code chat history',
        error: error.message
      });
    }
  }
}

export default new CodeChatController();
