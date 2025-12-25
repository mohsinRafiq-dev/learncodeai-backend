import dotenv from "dotenv";
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

class GeminiService {
  async generateTutorial(topic, language, difficulty = 'beginner') {
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key is not configured');
    }
    try {
      // Generate main tutorial content (no code examples)
      const contentPrompt = this.buildTutorialPrompt(topic, language, difficulty);
      const contentResponse = await this.callGemini(contentPrompt);
      const tutorialContent = this.extractText(contentResponse);

      // Generate code examples separately
      const codeExamplesPrompt = this.buildCodeExamplesPrompt(topic, language, difficulty);
      const codeResponse = await this.callGemini(codeExamplesPrompt);
      const codeExamplesText = this.extractText(codeResponse);

      return this.parseTutorialContent(tutorialContent, codeExamplesText, topic, language, difficulty);
    } catch (error) {
      console.error('Error generating tutorial with Gemini:', error);
      throw error;
    }
  }

  async callGemini(prompt) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`;
    const body = {
      contents: [{ 
        parts: [{ text: prompt }] 
      }]
    };
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Gemini API error: ${error.error?.message || JSON.stringify(error)}`);
    }
    return await response.json();
  }

  extractText(data) {
    // Gemini returns content in a nested structure
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  buildCodeExamplesPrompt(topic, language, difficulty) {
    return `Create 3 practical code examples for "${topic}" in ${language} at ${difficulty} level.\n\nFor each example, provide:\n1. The code (with helpful comments)\n2. A brief explanation of what it demonstrates\n\nFormat each example as:\nEXAMPLE [number]:\n\${language}\n[code here with comments]\n\\nEXPLANATION: [What this example demonstrates and key points to notice]\n\nMake the examples:\n- Progressive in complexity (start simple, get more advanced)\n- Practical and realistic\n- Well-commented\n- Different use cases or variations of the concept\n\nProvide exactly 3 examples now.`;
  }

  buildTutorialPrompt(topic, language, difficulty) {
    return `Create a comprehensive tutorial about "${topic}" for ${language} programming at ${difficulty} level.\n\nIMPORTANT: Do NOT include code examples in the main content. Code examples will be added separately in a dedicated section.\n\nStructure the tutorial with the following sections:\n\n1. **Introduction**: Brief overview of the topic and why it's important (2-3 paragraphs)\n2. **Key Concepts**: Main concepts that will be covered (use bullet points, 4-6 points)\n3. **Detailed Explanation**: In-depth explanation of the concept without code examples (use analogies, real-world comparisons, and clear descriptions)\n4. **How It Works**: Step-by-step explanation of the mechanics\n5. **Common Use Cases**: Where and when to use this concept (3-4 scenarios)\n6. **Common Pitfalls**: Things to watch out for (bullet points, 3-4 items)\n7. **Best Practices**: Professional tips and recommendations (bullet points, 3-4 items)\n8. **Practice Exercise**: Describe a simple exercise for the reader to try (without showing the solution code)\n9. **Summary**: Brief recap of what was learned (2-3 sentences)\n\nCRITICAL RULES:\n- Use markdown formatting with headers (##, ###)\n- Do NOT include any code blocks or code examples in your response\n- Focus on conceptual explanations, use cases, and best practices\n- Make it educational and easy to understand\n- Keep explanations clear and concise\n- Use analogies and real-world examples to explain concepts\n\nAfter you provide the tutorial content, I will separately add 2-3 code examples with explanations in a dedicated code examples section.\n\nPlease provide the complete tutorial content now (without any code).`;
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
}

export default new GeminiService();

