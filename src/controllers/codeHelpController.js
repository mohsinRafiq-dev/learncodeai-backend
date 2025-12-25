import geminiService from '../services/geminiService.js';

class CodeHelpController {
  async getErrorExplanation(req, res) {
    try {
      const { error, code, language } = req.body;
      
      if (!error) {
        return res.status(400).json({
          success: false,
          message: 'Error message is required'
        });
      }

      // Build a teaching-focused prompt for error debugging
      const systemPrompt = `You are a programming tutor helping a beginner understand and fix a code error.

IMPORTANT - TEACHING MODE (NOT SOLVING):
- DO NOT provide the fixed code
- DO provide guided hints to help them fix it
- Ask questions that guide their thinking
- Explain WHAT the error means in simple terms
- Help them understand WHY it happened
- Suggest steps they should take to debug
- Be encouraging and supportive
- Use simple language, avoid jargon

Error encountered: ${error}
Language: ${language}
${code ? `Their code:\n\`\`\`${language}\n${code}\n\`\`\`` : ''}`;

      const userPrompt = `A beginner got this error: "${error}". Help them understand what went wrong and guide them to fix it themselves. Don't give them the fixed code - help them think through it.`;

      const prompt = `${systemPrompt}\n\n${userPrompt}\n\nProvide a SHORT, beginner-friendly explanation (max 3-4 sentences) with hints on how to debug. Focus on understanding, not solutions.`;

      const response = await geminiService.callGemini(prompt);
      let explanation = geminiService.extractText(response);

      if (!explanation || explanation.trim() === '') {
        explanation = `Let me help you understand this error:

**What went wrong:** Your code tried to use something that doesn't exist.

**How to fix it:**
1. Read the error message - it usually tells you exactly what's missing
2. Find that variable or function in your code
3. Check if it's spelled correctly
4. Make sure it was created before you used it

Try running your code again and let me know what the exact error message says!`;
      }

      res.status(200).json({
        success: true,
        data: {
          explanation
        }
      });
    } catch (error) {
      console.error('Error in code help:', error);
      console.error('Error stack:', error.stack);
      
      // Provide fallback guidance
      res.status(200).json({
        success: true,
        data: {
          explanation: `I'm having trouble reaching my AI service, but don't worry! Here are some general tips:

**Common error types:**
- **NameError**: Used a variable that wasn't defined
- **IndentationError**: Wrong spacing before your code
- **SyntaxError**: Code isn't written correctly

Try:
1. Reading the error message carefully
2. Looking at the line number it mentions
3. Checking the code there for typos

Want to tell me more about what your code does?`
        }
      });
    }
  }

  async getProblemHint(req, res) {
    try {
      const { problem, code, language, attempt } = req.body;
      
      if (!problem) {
        return res.status(400).json({
          success: false,
          message: 'Problem description is required'
        });
      }

      // Build a teaching-focused prompt for problem solving
      const systemPrompt = `You are a programming tutor helping a beginner solve a coding problem.

IMPORTANT - TEACHING MODE (NOT SOLVING):
- DO NOT provide the complete solution or full code
- DO provide hints and guidance for the next step
- Ask what they've tried so far
- Help them break down the problem
- Suggest one small step they can try next
- Explain concepts they need to understand
- Be encouraging and patient
- Use simple language, avoid jargon

Problem: ${problem}
Language: ${language}
${attempt ? `What they've tried so far:\n\`\`\`${language}\n${attempt}\n\`\`\`` : ''}`;

      const userPrompt = `Help this beginner with their problem. Give them a HINT for the next step, not the solution. Ask guiding questions to help them think.`;

      const prompt = `${systemPrompt}\n\n${userPrompt}\n\nProvide guidance for ONE small step they can try next. Keep it brief and encouraging.`;

      const response = await geminiService.callGemini(prompt);
      let hint = geminiService.extractText(response);

      // Fallback hint if response is empty
      if (!hint || hint.trim() === '') {
        // Extract line numbers from problem if available
        const lineMatch = problem.match(/Line (\d+)/);
        const lineNumbers = lineMatch ? lineMatch[1] : "the error";
        
        hint = `**Let's fix this step by step:**

1. **Go to line ${lineNumbers}** where the error happened
2. **Look at that exact line** - what are you trying to do there?
3. **Check this line** - is the variable named \`s\` or \`i\` used here?
4. **Look ABOVE line ${lineNumbers}** - did you create/define this variable before using it?
5. **Check the spelling** - is it spelled exactly the same way everywhere?

Try this:
- Add a print statement before line ${lineNumbers}: \`print("Debug: variable name =", variable_name)\`
- Run your code and see what happens

What do you see when you look at line ${lineNumbers}?`;
      }

      res.status(200).json({
        success: true,
        data: {
          hint
        }
      });
    } catch (error) {
      console.error('Error in problem hint:', error);
      console.error('Error stack:', error.stack);
      
      // Extract line number from problem for specific guidance
      const lineMatch = req.body.problem?.match(/Line (\d+)/);
      const lineNum = lineMatch ? lineMatch[1] : "the error";
      
      // Provide fallback guidance when API fails
      res.status(200).json({
        success: true,
        data: {
          hint: `Let me help you debug line ${lineNum}!

**The error is telling you:** A variable name doesn't exist.

**Your action plan:**
1. Open line ${lineNum}
2. Look at which variables are being used (\`s\` and \`i\`?)
3. Scroll UP to see if you defined them first
4. Check spelling - uppercase vs lowercase matters!

Example:
\`\`\`
# This is WRONG (using before defining):
print(x)  # Error! x not defined yet
x = 5     # Defining it too late

# This is RIGHT (define first):
x = 5     # Define first
print(x)  # Use it
\`\`\`

Tell me: **What do you see on lines 15, 16, and 17?** (the lines around the error)`
        }
      });
    }
  }

  async askCodeQuestion(req, res) {
    try {
      const { question, code, language } = req.body;
      
      if (!question) {
        return res.status(400).json({
          success: false,
          message: 'Question is required'
        });
      }

      // Build a teaching-focused prompt for code questions
      const systemPrompt = `You are a programming tutor helping a beginner learn programming.

IMPORTANT - TEACHING MODE (NOT GIVING CODE):
- DO NOT write complete code for them
- DO help them understand concepts with markdown formatting
- Use headings (##, ###), bullet points (-), and **bold text** for key terms
- Guide them step-by-step to write code themselves
- Ask clarifying questions about what they want to do
- Explain the logic/approach first in structured, clear sections
- Help them learn to think like a programmer
- Be encouraging and supportive
- Use simple language, avoid jargon

Context:
Language: ${language}
${code ? `Their code:\n\`\`\`${language}\n${code}\n\`\`\`` : ''}`;

      const userPrompt = `A beginner is asking: "${question}". Help them understand and learn. Don't write the code for them - guide them to write it themselves.`;

      const prompt = `${systemPrompt}\n\n${userPrompt}\n\nProvide a helpful explanation using markdown formatting (##, ###, -, **bold**). Structure your response to help them learn step by step. Keep it beginner-friendly but thorough.`;

      const response = await geminiService.callGemini(prompt);
      let answer = geminiService.extractText(response);

      if (!answer || answer.trim() === '') {
        answer = `Great question! Let me guide you through this:

Instead of giving you the answer, let me ask you:
1. **What are you trying to do?** (describe the goal)
2. **What have you already tried?**
3. **Where are you stuck?**

Once I understand what you're working on, I can help you figure it out step by step!`;
      }

      res.status(200).json({
        success: true,
        data: {
          answer
        }
      });
    } catch (error) {
      console.error('Error in code question:', error);
      console.error('Error stack:', error.stack);
      
      // Provide fallback guidance
      res.status(200).json({
        success: true,
        data: {
          answer: `I'm having trouble connecting to my AI service right now, but I'm still here to help!

**Try asking me:**
- "How do I...?"
- "What does this code do?"
- "Why isn't my code working?"
- "How do variables work?"

Feel free to describe what you're working on, and I'll guide you through it!`
        }
      });
    }
  }
}

export default new CodeHelpController();

