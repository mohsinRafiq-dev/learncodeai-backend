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
    
    // Programming language — aligned with Course model
    language: {
      type: String,
      enum: ["python", "cpp", "javascript", "sql", "rust", "haskell"],
      default: "python",
      lowercase: true
    },

    // Concept name (e.g., "Variables", "Functions", "Loops")
    concept: {
      type: String,
      required: true,
      trim: true
    },

    // Module groups tutorials into a higher-level unit
    // e.g., "Foundations", "Data Structures", "Advanced Python"
    module: {
      type: String,
      trim: true,
      default: null,
    },

    // Sequence within (language, module, difficulty)
    // Lower = earlier. Lets the UI show "Next/Previous tutorial".
    order: {
      type: Number,
      default: 0,
      index: true,
    },

    // Prerequisites — tutorials a learner should finish first
    prerequisites: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tutorial",
    }],

    // Estimated minutes to complete (drives total path duration UI)
    estimatedMinutes: {
      type: Number,
      default: 15,
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

    // Scheduled publishing — content auto-publishes when publishAt <= now
    publishAt: {
      type: Date,
      default: null,
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
tutorialSchema.index({ language: 1, module: 1, order: 1 });
tutorialSchema.index({ createdBy: 1 });
tutorialSchema.index({ isPreGenerated: 1 });

const Tutorial = mongoose.model("Tutorial", tutorialSchema);
export default Tutorial;

