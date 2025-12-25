import dotenv from 'dotenv';
dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

class OpenAIService {
  async generateTutorial(topic, language, difficulty = 'beginner') {
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key is not configured');
    }

    try {
      // Generate main tutorial content
      const contentPrompt = this.buildTutorialPrompt(topic, language, difficulty);
      const contentResponse = await this.callOpenAI(contentPrompt);
      const tutorialContent = contentResponse.choices[0].message.content;

      // Generate code examples separately
      const codeExamplesPrompt = this.buildCodeExamplesPrompt(topic, language, difficulty);
      const codeResponse = await this.callOpenAI(codeExamplesPrompt);
      const codeExamplesText = codeResponse.choices[0].message.content;

      return this.parseTutorialContent(tutorialContent, codeExamplesText, topic, language, difficulty);
    } catch (error) {
      console.error('Error generating tutorial with OpenAI:', error);
      throw error;
    }
  }

  async callOpenAI(prompt) {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert programming tutor who creates comprehensive, well-structured tutorials for students learning to code. Your tutorials are clear, educational, and include practical examples.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 3000
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
    }

    return await response.json();
  }

  buildCodeExamplesPrompt(topic, language, difficulty) {
    return `Create 3 practical code examples for "${topic}" in ${language} at ${difficulty} level.

For each example, provide:
1. The code (with helpful comments)
2. A brief explanation of what it demonstrates

Format each example as:
EXAMPLE [number]:
\`\`\`${language}
[code here with comments]
\`\`\`
EXPLANATION: [What this example demonstrates and key points to notice]

Make the examples:
- Progressive in complexity (start simple, get more advanced)
- Practical and realistic
- Well-commented
- Different use cases or variations of the concept

Provide exactly 3 examples now.`;
  }

  buildTutorialPrompt(topic, language, difficulty) {
    return `Create a comprehensive tutorial about "${topic}" for ${language} programming at ${difficulty} level.

IMPORTANT: Do NOT include code examples in the main content. Code examples will be added separately in a dedicated section.

Structure the tutorial with the following sections:

1. **Introduction**: Brief overview of the topic and why it's important (2-3 paragraphs)
2. **Key Concepts**: Main concepts that will be covered (use bullet points, 4-6 points)
3. **Detailed Explanation**: In-depth explanation of the concept without code examples (use analogies, real-world comparisons, and clear descriptions)
4. **How It Works**: Step-by-step explanation of the mechanics
5. **Common Use Cases**: Where and when to use this concept (3-4 scenarios)
6. **Common Pitfalls**: Things to watch out for (bullet points, 3-4 items)
7. **Best Practices**: Professional tips and recommendations (bullet points, 3-4 items)
8. **Practice Exercise**: Describe a simple exercise for the reader to try (without showing the solution code)
9. **Summary**: Brief recap of what was learned (2-3 sentences)

CRITICAL RULES:
- Use markdown formatting with headers (##, ###)
- Do NOT include any code blocks or code examples in your response
- Focus on conceptual explanations, use cases, and best practices
- Make it educational and easy to understand
- Keep explanations clear and concise
- Use analogies and real-world examples to explain concepts

After you provide the tutorial content, I will separately add 2-3 code examples with explanations in a dedicated code examples section.

Please provide the complete tutorial content now (without any code).`;
  }

  parseTutorialContent(content, codeExamplesText, topic, language, difficulty) {
    // Parse code examples from the dedicated response
    const codeBlocks = [];
    const exampleRegex = /EXAMPLE \d+:\s*```[\w]*\n([\s\S]*?)```\s*EXPLANATION:\s*(.*?)(?=EXAMPLE \d+:|$)/gi;
    let match;

    while ((match = exampleRegex.exec(codeExamplesText)) !== null) {
      codeBlocks.push({
        code: match[1].trim(),
        explanation: match[2].trim()
      });
    }

    // Fallback: extract any remaining code blocks if the format wasn't followed
    if (codeBlocks.length === 0) {
      const codeBlockRegex = /```[\w]*\n([\s\S]*?)```/g;
      let exampleIndex = 1;
      while ((match = codeBlockRegex.exec(codeExamplesText)) !== null) {
        codeBlocks.push({
          code: match[1].trim(),
          explanation: `Example ${exampleIndex}: Demonstrating ${topic}`
        });
        exampleIndex++;
      }
    }

    // Extract tips (lines that start with common tip indicators)
    const tips = [];
    const tipRegex = /(?:💡|Tip:|Pro tip:|Best practice:|Remember:)(.*?)(?:\n|$)/gi;
    while ((match = tipRegex.exec(content)) !== null) {
      const tip = match[1].trim();
      if (tip) tips.push(tip);
    }

    // Extract notes (lines that mention "note" or "important")
    const notes = [];
    const noteRegex = /(?:📝|Note:|Important:|Keep in mind:)(.*?)(?:\n|$)/gi;
    while ((match = noteRegex.exec(content)) !== null) {
      const note = match[1].trim();
      if (note) notes.push(note);
    }

    // Generate title and description
    const title = `${topic} - ${language.charAt(0).toUpperCase() + language.slice(1)} Tutorial`;
    const description = `AI-generated comprehensive tutorial covering ${topic} in ${language} at ${difficulty} level.`;

    return {
      title,
      description,
      content,
      concept: topic,
      codeExamples: codeBlocks.length > 0 ? codeBlocks : [
        {
          code: `// ${topic} example in ${language}\n// Basic example demonstrating the concept`,
          explanation: `Example demonstrating ${topic}`
        }
      ],
      notes: notes.length > 0 ? notes : [
        'AI-generated content',
        'Review and verify examples before use',
        'Practice with the provided exercises'
      ],
      tips: tips.length > 0 ? tips : [
        `Practice ${topic} with real projects`,
        'Experiment with different variations',
        `Refer to ${language} documentation for more details`
      ]
    };
  }

  async testConnection() {
    if (!OPENAI_API_KEY) {
      return { success: false, message: 'OpenAI API key is not configured' };
    }

    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        }
      });

      if (response.ok) {
        return { success: true, message: 'OpenAI API connection successful' };
      } else {
        return { success: false, message: 'OpenAI API connection failed' };
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

export default new OpenAIService();

