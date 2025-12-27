import geminiService from "../services/geminiService.js";
import Quiz from "../models/Quiz.js";
import codeExecutorService from "../services/codeExecutorService.js";

class QuizGeneratorController {
  /**
   * Generate AI-powered quiz for a programming topic
   */
  async generateQuiz(req, res) {
    try {
      const {
        topic,
        language,
        difficulty,
        questionCount = 5,
        includeCodeQuestions = true,
      } = req.body;
      const userId = req.user._id;

      if (!topic || !language) {
        return res.status(400).json({
          success: false,
          message: "Topic and language are required",
        });
      }

      // Build AI prompt for quiz generation
      const prompt = this.buildQuizPrompt(
        topic,
        language,
        difficulty,
        questionCount,
        includeCodeQuestions
      );

      console.log(
        `Generating AI quiz: ${topic} in ${language} (${difficulty})`
      );

      const response = await geminiService.callGemini(prompt);
      const quizContent = geminiService.extractText(response);

      // Parse the AI response into quiz format
      const parsedQuiz = this.parseQuizContent(
        quizContent,
        topic,
        language,
        difficulty
      );

      // Create and save the quiz
      const quiz = new Quiz({
        title: `${topic} - ${
          language.charAt(0).toUpperCase() + language.slice(1)
        } Quiz`,
        description: `AI-generated quiz testing your knowledge of ${topic} in ${language}`,
        type: "practice-quiz",
        questions: parsedQuiz.questions,
        passingScore: 70,
        timeLimit: Math.max(questionCount * 2, 10), // 2 minutes per question, minimum 10
        shuffleQuestions: true,
        shuffleOptions: true,
        showAnswerExplanation: true,
        retakeAllowed: true,
        maxRetakes: 999,
        isPublished: true,
        createdBy: userId,
        isAIGenerated: true,
        language: language.toLowerCase(),
        topic: topic,
        difficulty: difficulty || "beginner",
      });

      await quiz.save();

      res.status(201).json({
        success: true,
        message: "Quiz generated successfully",
        data: quiz,
      });
    } catch (error) {
      console.error("Error generating quiz:", error);
      res.status(500).json({
        success: false,
        message: "Failed to generate quiz",
        error: error.message,
      });
    }
  }

  /**
   * Get all practice quizzes (standalone quizzes not tied to courses)
   */
  async getPracticeQuizzes(req, res) {
    try {
      const { language, difficulty, topic, page = 1, limit = 10 } = req.query;

      const filter = { type: "practice-quiz", isPublished: true };

      if (language) filter.language = language.toLowerCase();
      if (difficulty) filter.difficulty = difficulty.toLowerCase();
      if (topic) filter.topic = { $regex: topic, $options: "i" };

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const quizzes = await Quiz.find(filter)
        .select(
          "title description language difficulty topic timeLimit questions createdAt"
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      // Add question count to each quiz
      const quizzesWithCount = quizzes.map((quiz) => ({
        ...quiz,
        questionCount: quiz.questions?.length || 0,
        questions: undefined, // Don't send questions in list view
      }));

      const total = await Quiz.countDocuments(filter);

      res.status(200).json({
        success: true,
        data: {
          quizzes: quizzesWithCount,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit)),
          },
        },
      });
    } catch (error) {
      console.error("Error fetching practice quizzes:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch quizzes",
        error: error.message,
      });
    }
  }

  /**
   * Get a specific practice quiz with full details
   */
  async getPracticeQuiz(req, res) {
    try {
      const { quizId } = req.params;

      const quiz = await Quiz.findById(quizId);

      if (!quiz) {
        return res.status(404).json({
          success: false,
          message: "Quiz not found",
        });
      }

      res.status(200).json({
        success: true,
        data: quiz,
      });
    } catch (error) {
      console.error("Error fetching quiz:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch quiz",
        error: error.message,
      });
    }
  }

  /**
   * Submit practice quiz answers with code execution support
   */
  async submitPracticeQuiz(req, res) {
    try {
      const { quizId } = req.params;
      const { answers, timeSpent } = req.body;
      const userId = req.user._id;

      const quiz = await Quiz.findById(quizId);

      if (!quiz) {
        return res.status(404).json({
          success: false,
          message: "Quiz not found",
        });
      }

      let totalPoints = 0;
      let earnedPoints = 0;
      const results = [];

      for (const question of quiz.questions) {
        const userAnswer = answers[question._id.toString()];
        totalPoints += question.points;

        let isCorrect = false;
        let explanation = question.explanation || "";
        let codeOutput = null;

        switch (question.type) {
          case "multiple-choice":
            const correctOption = question.options.find((opt) => opt.isCorrect);
            isCorrect = userAnswer === correctOption?.text;
            break;

          case "true-false":
            const correctTFOption = question.options.find(
              (opt) => opt.isCorrect
            );
            isCorrect = userAnswer === correctTFOption?.text;
            break;

          case "short-answer":
            const acceptedAnswers = question.caseSensitive
              ? question.acceptableAnswers
              : question.acceptableAnswers?.map((a) => a.toLowerCase()) || [];
            const normalizedAnswer = question.caseSensitive
              ? userAnswer
              : userAnswer?.toLowerCase();
            isCorrect = acceptedAnswers.includes(normalizedAnswer);
            break;

          case "coding":
            // Execute the code and compare output
            if (userAnswer && question.codingProblem?.testCases?.length > 0) {
              try {
                const executionResults = await this.executeCodeTests(
                  userAnswer,
                  question.codingProblem.language || quiz.language,
                  question.codingProblem.testCases
                );

                codeOutput = executionResults;
                isCorrect = executionResults.allPassed;

                if (!isCorrect) {
                  explanation = `Your code failed ${executionResults.failedCount} of ${executionResults.totalTests} test cases. ${explanation}`;
                }
              } catch (execError) {
                console.error("Code execution error:", execError);
                codeOutput = { error: execError.message };
                isCorrect = false;
                explanation = `Code execution error: ${execError.message}. ${explanation}`;
              }
            }
            break;
        }

        if (isCorrect) {
          earnedPoints += question.points;
        }

        results.push({
          questionId: question._id,
          question: question.question,
          type: question.type,
          userAnswer,
          correctAnswer: this.getCorrectAnswer(question),
          isCorrect,
          explanation,
          points: question.points,
          codeOutput,
        });
      }

      const scorePercentage = Math.round((earnedPoints / totalPoints) * 100);
      const passed = scorePercentage >= quiz.passingScore;

      // Calculate performance metrics
      const performanceMetrics = {
        totalQuestions: quiz.questions.length,
        correctAnswers: results.filter((r) => r.isCorrect).length,
        incorrectAnswers: results.filter((r) => !r.isCorrect).length,
        scorePercentage,
        passed,
        timeSpent: timeSpent || 0,
        averageTimePerQuestion: timeSpent
          ? Math.round(timeSpent / quiz.questions.length)
          : 0,
      };

      res.status(200).json({
        success: true,
        message: passed ? "Congratulations! You passed!" : "Keep practicing!",
        data: {
          score: scorePercentage,
          passed,
          results,
          performanceMetrics,
          quizTitle: quiz.title,
        },
      });
    } catch (error) {
      console.error("Error submitting quiz:", error);
      res.status(500).json({
        success: false,
        message: "Failed to submit quiz",
        error: error.message,
      });
    }
  }

  /**
   * Execute code against test cases
   */
  async executeCodeTests(code, language, testCases) {
    const results = [];
    let passedCount = 0;

    for (const testCase of testCases) {
      try {
        const result = await codeExecutorService.executeCode(
          code,
          language,
          testCase.input
        );

        const actualOutput = result.output?.trim() || "";
        const expectedOutput = testCase.expectedOutput?.trim() || "";
        const passed = actualOutput === expectedOutput;

        if (passed) passedCount++;

        results.push({
          input: testCase.input,
          expectedOutput,
          actualOutput,
          passed,
          error: result.error || null,
        });
      } catch (error) {
        results.push({
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: null,
          passed: false,
          error: error.message,
        });
      }
    }

    return {
      totalTests: testCases.length,
      passedCount,
      failedCount: testCases.length - passedCount,
      allPassed: passedCount === testCases.length,
      testResults: results,
    };
  }

  /**
   * Get correct answer for a question
   */
  getCorrectAnswer(question) {
    switch (question.type) {
      case "multiple-choice":
      case "true-false":
        return question.options?.find((opt) => opt.isCorrect)?.text || "";
      case "short-answer":
        return question.acceptableAnswers?.[0] || "";
      case "coding":
        return question.codingProblem?.starterCode || "See solution";
      default:
        return "";
    }
  }

  /**
   * Build AI prompt for quiz generation
   */
  buildQuizPrompt(
    topic,
    language,
    difficulty,
    questionCount,
    includeCodeQuestions
  ) {
    const difficultyDesc = {
      beginner: "basic concepts, simple syntax, fundamental understanding",
      intermediate:
        "practical applications, common patterns, moderate complexity",
      advanced: "advanced concepts, edge cases, optimization, best practices",
    };

    return `Generate a programming quiz about "${topic}" for ${language} at ${
      difficulty || "beginner"
    } level.

Create exactly ${questionCount} questions following this JSON format:

{
  "questions": [
    {
      "type": "multiple-choice",
      "question": "Clear question text here?",
      "options": [
        {"text": "Option A", "isCorrect": false},
        {"text": "Option B", "isCorrect": true},
        {"text": "Option C", "isCorrect": false},
        {"text": "Option D", "isCorrect": false}
      ],
      "explanation": "Brief explanation of why the correct answer is right",
      "points": 10
    },
    {
      "type": "true-false",
      "question": "Statement to evaluate as true or false?",
      "options": [
        {"text": "True", "isCorrect": true},
        {"text": "False", "isCorrect": false}
      ],
      "explanation": "Brief explanation",
      "points": 5
    }${
      includeCodeQuestions
        ? `,
    {
      "type": "coding",
      "question": "Write a function that...",
      "codingProblem": {
        "title": "Problem Title",
        "description": "Detailed problem description",
        "starterCode": "// Starter code template",
        "language": "${language}",
        "testCases": [
          {"input": "test input", "expectedOutput": "expected output"}
        ]
      },
      "explanation": "Solution approach explanation",
      "points": 20
    }`
        : ""
    }
  ]
}

Requirements:
- Focus on: ${difficultyDesc[difficulty] || difficultyDesc.beginner}
- Include a mix of question types (mostly multiple-choice, some true/false${
      includeCodeQuestions ? ", and 1-2 coding problems" : ""
    })
- Each question should test understanding of ${topic} in ${language}
- Explanations should be educational and helpful
- For multiple choice, always have exactly 4 options with only ONE correct answer
- Return ONLY valid JSON, no additional text`;
  }

  /**
   * Parse AI-generated quiz content
   */
  parseQuizContent(content, topic, language, difficulty) {
    try {
      // Extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No valid JSON found in response");
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate and fix questions
      const questions = (parsed.questions || []).map((q, index) => ({
        type: q.type || "multiple-choice",
        question: q.question || `Question ${index + 1}`,
        description: q.description || "",
        order: index + 1,
        options: q.options || [],
        acceptableAnswers: q.acceptableAnswers || [],
        caseSensitive: q.caseSensitive || false,
        codingProblem: q.codingProblem || null,
        points: q.points || 10,
        explanation: q.explanation || "",
      }));

      return { questions };
    } catch (error) {
      console.error("Error parsing quiz content:", error);
      // Return a fallback quiz structure
      return {
        questions: [
          {
            type: "multiple-choice",
            question: `What is ${topic} in ${language}?`,
            order: 1,
            options: [
              { text: "A fundamental concept", isCorrect: true },
              { text: "Not related to programming", isCorrect: false },
              { text: "Only used in web development", isCorrect: false },
              { text: "A deprecated feature", isCorrect: false },
            ],
            points: 10,
            explanation: `${topic} is an important concept in ${language} programming.`,
          },
        ],
      };
    }
  }
}

export default new QuizGeneratorController();
