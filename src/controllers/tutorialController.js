import Tutorial from '../models/Tutorial.js';
import UserSavedTutorial from '../models/UserSavedTutorial.js';
import Feedback from '../models/Feedback.js';
import openaiService from '../services/openaiService.js';
import geminiService from '../services/geminiService.js';

class TutorialController {
  // Get all pre-generated tutorials, optionally filtered by language
  async getAllTutorials(req, res) {
    try {
      const { language, difficulty, concept } = req.query;
      
      // Build filter
      const filter = { isPreGenerated: true };
      
      if (language) {
        filter.language = language.toLowerCase();
      }
      
      if (difficulty) {
        filter.difficulty = difficulty.toLowerCase();
      }
      
      if (concept) {
        filter.concept = new RegExp(concept, 'i'); // Case-insensitive search
      }
      
      const tutorials = await Tutorial.find(filter)
        .select('-feedbacks') // Exclude feedbacks for list view
        .sort({ language: 1, difficulty: 1, concept: 1 })
        .lean();
      
      res.status(200).json({
        success: true,
        count: tutorials.length,
        data: tutorials
      });
    } catch (error) {
      console.error('Error fetching tutorials:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching tutorials',
        error: error.message
      });
    }
  }

  // Get tutorial by ID with full details
  async getTutorialById(req, res) {
    try {
      const { id } = req.params;
      
      const tutorial = await Tutorial.findById(id)
        .populate('feedbacks', 'rating comment');
      
      if (!tutorial) {
        return res.status(404).json({
          success: false,
          message: 'Tutorial not found'
        });
      }
      
      res.status(200).json({
        success: true,
        data: tutorial
      });
    } catch (error) {
      console.error('Error fetching tutorial:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching tutorial',
        error: error.message
      });
    }
  }

  // Get tutorials by language
  async getTutorialsByLanguage(req, res) {
    try {
      const { language } = req.params;
      const { difficulty } = req.query;
      
      // Validate language
      const validLanguages = ['python', 'cpp', 'javascript'];
      if (!validLanguages.includes(language.toLowerCase())) {
        return res.status(400).json({
          success: false,
          message: `Invalid language. Supported: ${validLanguages.join(', ')}`
        });
      }
      
      const filter = { 
        language: language.toLowerCase(),
        isPreGenerated: true
      };
      
      if (difficulty) {
        filter.difficulty = difficulty.toLowerCase();
      }
      
      const tutorials = await Tutorial.find(filter)
        .select('title description content concept difficulty language codeExamples notes tips tags')
        .sort({ difficulty: 1, concept: 1 })
        .lean();
      
      // Group by concept
      const grouped = tutorials.reduce((acc, tutorial) => {
        if (!acc[tutorial.concept]) {
          acc[tutorial.concept] = [];
        }
        acc[tutorial.concept].push(tutorial);
        return acc;
      }, {});
      
      res.status(200).json({
        success: true,
        language: language.toLowerCase(),
        conceptCount: Object.keys(grouped).length,
        tutorials: grouped
      });
    } catch (error) {
      console.error('Error fetching tutorials by language:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching tutorials',
        error: error.message
      });
    }
  }

  // Save a tutorial for the current user
  async saveTutorial(req, res) {
    try {
      const { tutorialId } = req.body;
      const userId = req.user._id;
      
      if (!tutorialId) {
        return res.status(400).json({
          success: false,
          message: 'Tutorial ID is required'
        });
      }
      
      // Check if tutorial exists
      const tutorial = await Tutorial.findById(tutorialId);
      if (!tutorial) {
        return res.status(404).json({
          success: false,
          message: 'Tutorial not found'
        });
      }
      
      // Check if already saved
      const alreadySaved = await UserSavedTutorial.findOne({
        userId,
        tutorialId
      });
      
      if (alreadySaved) {
        return res.status(400).json({
          success: false,
          message: 'Tutorial already saved'
        });
      }
      
      // Create new saved tutorial entry
      const savedTutorial = new UserSavedTutorial({
        userId,
        tutorialId,
        progress: {
          lastAccessedAt: new Date()
        }
      });
      
      await savedTutorial.save();
      
      res.status(201).json({
        success: true,
        message: 'Tutorial saved successfully',
        data: savedTutorial
      });
    } catch (error) {
      console.error('Error saving tutorial:', error);
      res.status(500).json({
        success: false,
        message: 'Error saving tutorial',
        error: error.message
      });
    }
  }

  // Get user's saved tutorials
  async getSavedTutorials(req, res) {
    try {
      const userId = req.user._id;
      const { language } = req.query;
      
      const filter = { userId };
      
      // If language filter provided, query tutorials as well
      if (language) {
        const languageTutorials = await Tutorial.find({ language: language.toLowerCase() });
        const tutorialIds = languageTutorials.map(t => t._id);
        filter.tutorialId = { $in: tutorialIds };
      }
      
      const savedTutorials = await UserSavedTutorial.find(filter)
        .populate({
          path: 'tutorialId',
          select: 'title concept language difficulty codeExamples description'
        })
        .sort({ savedAt: -1 })
        .lean();
      
      // Transform tutorialId to tutorial for frontend compatibility
      const transformedTutorials = savedTutorials.map(saved => ({
        _id: saved._id,
        savedAt: saved.savedAt,
        progress: saved.progress,
        tutorial: saved.tutorialId // Rename tutorialId to tutorial
      }));
      
      res.status(200).json({
        success: true,
        count: transformedTutorials.length,
        data: transformedTutorials
      });
    } catch (error) {
      console.error('Error fetching saved tutorials:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching saved tutorials',
        error: error.message
      });
    }
  }

  // Unsave a tutorial
  async unsaveTutorial(req, res) {
    try {
      const { tutorialId } = req.params;
      const userId = req.user._id;
      
      const result = await UserSavedTutorial.findOneAndDelete({
        userId,
        tutorialId
      });
      
      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'Saved tutorial not found'
        });
      }
      
      res.status(200).json({
        success: true,
        message: 'Tutorial unsaved successfully'
      });
    } catch (error) {
      console.error('Error unsaving tutorial:', error);
      res.status(500).json({
        success: false,
        message: 'Error unsaving tutorial',
        error: error.message
      });
    }
  }

  // Update tutorial progress
  async updateTutorialProgress(req, res) {
    try {
      const { tutorialId } = req.params;
      const { isCompleted, rating, notes, completedExampleId } = req.body;
      const userId = req.user._id;
      
      const savedTutorial = await UserSavedTutorial.findOne({
        userId,
        tutorialId
      });
      
      if (!savedTutorial) {
        return res.status(404).json({
          success: false,
          message: 'Saved tutorial not found'
        });
      }
      
      // Update progress
      if (isCompleted !== undefined) {
        savedTutorial.progress.isCompleted = isCompleted;
        if (isCompleted) {
          savedTutorial.progress.completedAt = new Date();
        }
      }
      
      if (rating) {
        savedTutorial.progress.rating = rating;
      }
      
      if (notes) {
        savedTutorial.progress.notes = notes;
      }
      
      if (completedExampleId) {
        savedTutorial.progress.completedCodeExamples.push({
          exampleId: completedExampleId,
          completedAt: new Date()
        });
      }
      
      savedTutorial.progress.lastAccessedAt = new Date();
      savedTutorial.updatedAt = new Date();
      
      await savedTutorial.save();
      
      res.status(200).json({
        success: true,
        message: 'Tutorial progress updated',
        data: savedTutorial
      });
    } catch (error) {
      console.error('Error updating tutorial progress:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating tutorial progress',
        error: error.message
      });
    }
  }

  // Create a new tutorial (with AI generation support)
  async createTutorial(req, res) {
    try {
      const { title, description, content, language, concept, difficulty, codeExamples, tags, notes, tips } = req.body;
      const userId = req.user._id;
      
      // Validate required fields
      if (!language || !concept) {
        return res.status(400).json({
          success: false,
          message: 'Language and concept are required'
        });
      }
      
      // Check if this is an AI-generated tutorial (based on tags)
      const isAIgenerated = tags && tags.includes('AI-generated');
      
      let tutorialData = {
        title: title || concept,
        description: description || `Tutorial about ${concept}`,
        content: content || '',
        language: language.toLowerCase(),
        concept,
        difficulty: difficulty || 'beginner',
        codeExamples: codeExamples || [],
        notes: notes || [],
        tips: tips || [],
        tags: tags || []
      };

      // If AI-generated, use OpenAI to generate real content
      if (isAIgenerated) {
        // --- GEMINI AI GENERATION (default) ---
        try {
          console.log(`Generating AI tutorial for: ${concept} in ${language} (Gemini)`);
          const aiContent = await geminiService.generateTutorial(
            concept,
            language.toLowerCase(),
            difficulty || 'beginner'
          );
          tutorialData = {
            ...tutorialData,
            title: aiContent.title,
            description: aiContent.description,
            content: aiContent.content,
            codeExamples: aiContent.codeExamples,
            notes: aiContent.notes,
            tips: aiContent.tips
          };
          console.log('AI tutorial generated successfully (Gemini)');
        } catch (aiError) {
          console.error('Error generating AI content (Gemini):', aiError);
          if (!content) {
            return res.status(500).json({
              success: false,
              message: 'Failed to generate AI content. Please try again or provide content manually.',
              error: aiError.message
            });
          }
        }

        /*
        // --- OPENAI AI GENERATION (uncomment to use OpenAI instead) ---
        try {
          console.log(`Generating AI tutorial for: ${concept} in ${language} (OpenAI)`);
          const aiContent = await openaiService.generateTutorial(
            concept,
            language.toLowerCase(),
            difficulty || 'beginner'
          );
          tutorialData = {
            ...tutorialData,
            title: aiContent.title,
            description: aiContent.description,
            content: aiContent.content,
            codeExamples: aiContent.codeExamples,
            notes: aiContent.notes,
            tips: aiContent.tips
          };
          console.log('AI tutorial generated successfully (OpenAI)');
        } catch (openaiError) {
          console.error('Error generating AI content (OpenAI):', openaiError);
          if (!content) {
            return res.status(500).json({
              success: false,
              message: 'Failed to generate AI content. Please try again or provide content manually.',
              error: openaiError.message
            });
          }
        }
        */
      } else if (!title || !content) {
        // Non-AI tutorials require title and content
        return res.status(400).json({
          success: false,
          message: 'Title and content are required for manual tutorials'
        });
      }
      
      const tutorial = new Tutorial({
        ...tutorialData,
        createdBy: userId,
        isPreGenerated: false,
        isAIgenerated: isAIgenerated
      });
      
      await tutorial.save();
      
      res.status(201).json({
        success: true,
        message: 'Tutorial created successfully',
        data: tutorial
      });
    } catch (error) {
      console.error('Error creating tutorial:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating tutorial',
        error: error.message
      });
    }
  }

  // Get user's created tutorials (AI-generated or custom)
  async getUserCreatedTutorials(req, res) {
    try {
      const userId = req.user._id;
      
      const tutorials = await Tutorial.find({ 
        createdBy: userId,
        isPreGenerated: false 
      })
        .sort({ createdAt: -1 })
        .lean();
      
      res.status(200).json({
        success: true,
        count: tutorials.length,
        data: tutorials
      });
    } catch (error) {
      console.error('Error fetching user created tutorials:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching created tutorials',
        error: error.message
      });
    }
  }

  // Delete user's own tutorial
  async deleteUserTutorial(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user._id;
      
      // Find the tutorial and check ownership
      const tutorial = await Tutorial.findOne({ _id: id, createdBy: userId });
      
      if (!tutorial) {
        return res.status(404).json({
          success: false,
          message: 'Tutorial not found or you do not have permission to delete it'
        });
      }
      
      // Don't allow deletion of pre-generated tutorials
      if (tutorial.isPreGenerated) {
        return res.status(403).json({
          success: false,
          message: 'Cannot delete pre-generated tutorials'
        });
      }
      
      await Tutorial.findByIdAndDelete(id);
      
      // Also delete associated saved tutorials
      await UserSavedTutorial.deleteMany({ tutorial: id });
      
      res.status(200).json({
        success: true,
        message: 'Tutorial deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting tutorial:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting tutorial',
        error: error.message
      });
    }
  }

  // Admin: Create pre-generated tutorial
  async adminCreateTutorial(req, res) {
    try {
      const { title, description, content, language, concept, difficulty, codeExamples, notes, tips, tags } = req.body;
      
      // Validate required fields
      if (!title || !content || !language || !concept) {
        return res.status(400).json({
          success: false,
          message: 'Title, content, language, and concept are required'
        });
      }
      
      const tutorial = new Tutorial({
        title,
        description,
        content,
        language: language.toLowerCase(),
        concept,
        difficulty: difficulty || 'beginner',
        codeExamples: codeExamples || [],
        notes: notes || [],
        tips: tips || [],
        tags: tags || [],
        createdBy: req.user._id,
        isPreGenerated: true,
        isAIgenerated: false
      });
      
      await tutorial.save();
      
      res.status(201).json({
        success: true,
        message: 'Tutorial created successfully',
        data: tutorial
      });
    } catch (error) {
      console.error('Error creating tutorial:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating tutorial',
        error: error.message
      });
    }
  }

  // Admin: Update tutorial
  async adminUpdateTutorial(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      // If language is provided, normalize it
      if (updates.language) {
        updates.language = updates.language.toLowerCase();
      }
      
      const tutorial = await Tutorial.findByIdAndUpdate(
        id,
        updates,
        { new: true, runValidators: true }
      );
      
      if (!tutorial) {
        return res.status(404).json({
          success: false,
          message: 'Tutorial not found'
        });
      }
      
      res.status(200).json({
        success: true,
        message: 'Tutorial updated successfully',
        data: tutorial
      });
    } catch (error) {
      console.error('Error updating tutorial:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating tutorial',
        error: error.message
      });
    }
  }

  // Admin: Delete tutorial
  async adminDeleteTutorial(req, res) {
    try {
      const { id } = req.params;
      
      const tutorial = await Tutorial.findByIdAndDelete(id);
      
      if (!tutorial) {
        return res.status(404).json({
          success: false,
          message: 'Tutorial not found'
        });
      }
      
      // Also delete associated saved tutorials
      await UserSavedTutorial.deleteMany({ tutorial: id });
      
      res.status(200).json({
        success: true,
        message: 'Tutorial deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting tutorial:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting tutorial',
        error: error.message
      });
    }
  }

  // Admin: Get all tutorials (including drafts)
  async adminGetAllTutorials(req, res) {
    try {
      const { page = 1, limit = 20, language, difficulty, search } = req.query;
      
      const filter = {};
      
      if (language) {
        filter.language = language.toLowerCase();
      }
      
      if (difficulty) {
        filter.difficulty = difficulty.toLowerCase();
      }
      
      if (search) {
        filter.$or = [
          { title: new RegExp(search, 'i') },
          { concept: new RegExp(search, 'i') },
          { description: new RegExp(search, 'i') }
        ];
      }
      
      const skip = (page - 1) * limit;
      
      const [tutorials, total] = await Promise.all([
        Tutorial.find(filter)
          .populate('createdBy', 'name email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        Tutorial.countDocuments(filter)
      ]);
      
      res.status(200).json({
        success: true,
        data: tutorials,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error fetching tutorials:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching tutorials',
        error: error.message
      });
    }
  }

  // Get distinct concepts for a language
  async getConceptsByLanguage(req, res) {
    try {
      const { language } = req.params;
      
      const validLanguages = ['python', 'cpp', 'javascript'];
      if (!validLanguages.includes(language.toLowerCase())) {
        return res.status(400).json({
          success: false,
          message: `Invalid language. Supported: ${validLanguages.join(', ')}`
        });
      }
      
      const concepts = await Tutorial.distinct('concept', {
        language: language.toLowerCase(),
        isPreGenerated: true
      });
      
      concepts.sort();
      
      res.status(200).json({
        success: true,
        language: language.toLowerCase(),
        count: concepts.length,
        concepts
      });
    } catch (error) {
      console.error('Error fetching concepts:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching concepts',
        error: error.message
      });
    }
  }

  // Get all available languages
  async getLanguages(req, res) {
    try {
      const languages = await Tutorial.distinct('language');
      
      res.status(200).json({
        success: true,
        data: languages.sort()
      });
    } catch (error) {
      console.error('Error fetching languages:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching languages',
        error: error.message
      });
    }
  }

  // Get user's created tutorials (AI-generated or custom)
  async getUserCreatedTutorials(req, res) {
    try {
      const userId = req.user._id;
      
      const tutorials = await Tutorial.find({ 
        createdBy: userId,
        isPreGenerated: false 
      })
        .sort({ createdAt: -1 })
        .lean();
      
      res.status(200).json({
        success: true,
        count: tutorials.length,
        data: tutorials
      });
    } catch (error) {
      console.error('Error fetching user created tutorials:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching created tutorials',
        error: error.message
      });
    }
  }

  // Delete user's own tutorial
  async deleteUserTutorial(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user._id;
      
      // Find the tutorial and check ownership
      const tutorial = await Tutorial.findOne({ _id: id, createdBy: userId });
      
      if (!tutorial) {
        return res.status(404).json({
          success: false,
          message: 'Tutorial not found or you do not have permission to delete it'
        });
      }
      
      // Don't allow deletion of pre-generated tutorials
      if (tutorial.isPreGenerated) {
        return res.status(403).json({
          success: false,
          message: 'Cannot delete pre-generated tutorials'
        });
      }
      
      await Tutorial.findByIdAndDelete(id);
      
      // Also delete associated saved tutorials
      await UserSavedTutorial.deleteMany({ tutorial: id });
      
      res.status(200).json({
        success: true,
        message: 'Tutorial deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting tutorial:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting tutorial',
        error: error.message
      });
    }
  }
}

export default new TutorialController();

