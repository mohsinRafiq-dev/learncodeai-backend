import codeExecutorWSService from '../services/codeExecutorWSService.js';

class CodeExecutionController {
  async executeCode(req, res) {
    try {
      const { code, language, input } = req.body;

      if (!code || !language) {
        return res.status(400).json({
          success: false,
          message: 'Code and language are required'
        });
      }

      // Execute code
      const result = await codeExecutorWSService.executeCode(code, language, input);

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
