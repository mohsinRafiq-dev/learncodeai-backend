import codeExecutorWSService from '../services/codeExecutorWSService.js';
import gamificationService from '../services/gamificationService.js';
import ErrorLog from '../models/ErrorLog.js';

const classifyError = (message = '', language = '') => {
  const m = message.toLowerCase();
  if (m.includes('timeout') || m.includes('timed out')) return 'timeout';
  if (m.includes('syntaxerror') || m.includes('syntax error') || m.includes('parse error')) return 'syntax';
  if (language === 'cpp' && (m.includes('compile') || m.includes('error:'))) return 'compilation';
  if (m.includes('error') || m.includes('exception') || m.includes('traceback')) return 'runtime';
  return 'other';
};

class CodeExecutionController {
  async executeCode(req, res) {
    try {
      const { code, language, input } = req.body;
      const userId = req.user?._id;

      if (!code || !language) {
        return res.status(400).json({
          success: false,
          message: 'Code and language are required'
        });
      }

      // Execute code
      const result = await codeExecutorWSService.executeCode(code, language, input);

      // Log execution errors for analytics
      const errorText = result?.error || result?.stderr || '';
      if (errorText) {
        const { courseId, lessonId, tutorialId } = req.body || {};
        ErrorLog.create({
          user: userId || null,
          language: language.toLowerCase(),
          errorType: classifyError(errorText, language),
          errorMessage: String(errorText).slice(0, 1000),
          snippet: String(code || '').slice(0, 500),
          courseId: courseId || null,
          lessonId: lessonId || null,
          tutorialId: tutorialId || null,
        }).catch((e) => console.warn('ErrorLog save failed:', e.message));
      }

      // Award points for successful execution
      if (userId && result && !result.error) {
        await gamificationService.addPoints(
          userId,
          15, // 15 points for successful code execution
          'code_executed',
          null
        );
        await gamificationService.updateStreak(userId);
      }

      res.status(200).json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Code execution error:', error);
      
      res.status(500).json({
        success: false,
        message: 'Code execution failed',
        error: error.message
      });
    }
  }

  async getLanguages(req, res) {
    try {
      const languages = [
        { id: 'python', name: 'Python', version: '3.11' },
        { id: 'cpp', name: 'C++', version: 'GCC Latest' },
        { id: 'javascript', name: 'JavaScript', version: 'Node.js 18' }
      ];

      res.status(200).json({
        success: true,
        data: languages
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

export default new CodeExecutionController();
