import codeExecutorWSService from '../services/codeExecutorWSService.js';
import gamificationService from '../services/gamificationService.js';
import ErrorLog from '../models/ErrorLog.js';
import { invalidateAnalyticsCache } from './adminController.js';

// Fire-and-forget helper used by both the success-path (captured stderr) and
// the catch-path (executor itself crashed). Busts the admin analytics cache so
// the chart reflects the new entry on the next page-load instead of waiting
// for the 5-min TTL.
const recordError = (payload) => {
  ErrorLog.create(payload)
    .then(() => {
      try {
        invalidateAnalyticsCache();
      } catch (_) {
        // best-effort — fine if the cache module isn't ready yet
      }
    })
    .catch((e) => console.warn('ErrorLog save failed:', e.message));
};

const classifyError = (message = '', language = '') => {
  // Defensive: stderr/error can arrive as an object, Buffer, or undefined.
  const m = String(message ?? "").toLowerCase();
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

      // Log execution errors for analytics (captured stderr / runtime error)
      const errorText = result?.error || result?.stderr || '';
      if (errorText) {
        const { courseId, lessonId, tutorialId } = req.body || {};
        recordError({
          user: userId || null,
          language: language.toLowerCase(),
          errorType: classifyError(errorText, language),
          errorMessage: String(errorText).slice(0, 1000),
          snippet: String(code || '').slice(0, 500),
          courseId: courseId || null,
          lessonId: lessonId || null,
          tutorialId: tutorialId || null,
        });
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

      // Executor itself threw (Docker timeout / sandbox crash etc). Still
      // surface this in analytics so admins see executor health issues + the
      // user's failure doesn't disappear into a 500.
      try {
        const { code, language } = req.body || {};
        if (language) {
          const { courseId, lessonId, tutorialId } = req.body || {};
          recordError({
            user: req.user?._id || null,
            language: String(language).toLowerCase(),
            errorType: classifyError(error?.message || '', language),
            errorMessage: String(error?.message || 'executor failed').slice(0, 1000),
            snippet: String(code || '').slice(0, 500),
            courseId: courseId || null,
            lessonId: lessonId || null,
            tutorialId: tutorialId || null,
          });
        }
      } catch (_) {
        // best-effort
      }

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
