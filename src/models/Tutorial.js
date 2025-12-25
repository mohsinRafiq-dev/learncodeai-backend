import mongoose from "mongoose";

const codeExampleSchema = new mongoose.Schema({
  title: String,
  description: String,
  code: String,
  input: String,
  expectedOutput: String,
  order: Number
}, { _id: true });

const tutorialSchema = new mongoose.Schema(
  {
    // Core tutorial information
    title: { 
      type: String, 
      required: true, 
      trim: true 
    },
    
    description: {
      type: String,
      required: true
    },
    
    // Detailed content
    content: { 
      type: String, 
      required: true 
    },
    
    // Programming language
    language: { 
      type: String, 
      enum: ["python", "cpp", "javascript"],
      default: "python",
      lowercase: true
    },
    
    // Concept name (e.g., "Variables", "Functions", "Loops")
    concept: {
      type: String,
      required: true,
      trim: true
    },
    
    // Difficulty level
    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },
    
    // Code examples for this tutorial
    codeExamples: [codeExampleSchema],
    
    // Additional notes
    notes: [String],
    tips: [String],
    
    // Tracking
    createdBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User",
      default: null
    },
    isPreGenerated: {
      type: Boolean,
      default: true
    },
    isAIgenerated: { 
      type: Boolean, 
      default: false 
    },
    isPublished: {
      type: Boolean,
      default: false
    },
    
    // Metadata
    tags: [String],
    averageRating: { 
      type: Number, 
      default: 0 
    },
    viewCount: {
      type: Number,
      default: 0
    },
    feedbacks: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Feedback" 
    }],
    pdfLink: { 
      type: String, 
      default: null 
    },
  },
  { timestamps: true }
);

// Indexes for efficient querying
tutorialSchema.index({ language: 1, concept: 1 });
tutorialSchema.index({ language: 1, difficulty: 1 });
tutorialSchema.index({ createdBy: 1 });
tutorialSchema.index({ isPreGenerated: 1 });

const Tutorial = mongoose.model("Tutorial", tutorialSchema);
export default Tutorial;

