import mongoose from 'mongoose';

const userSavedTutorialSchema = new mongoose.Schema(
  {
    // User who saved the tutorial
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    
    // Tutorial being saved
    tutorialId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tutorial',
      required: true
    },
    
    // Optional: track progress on this tutorial
    progress: {
      isCompleted: {
        type: Boolean,
        default: false
      },
      completedAt: Date,
      completedCodeExamples: [
        {
          exampleId: mongoose.Schema.Types.ObjectId,
          completedAt: Date
        }
      ],
      lastAccessedAt: Date,
      rating: {
        type: Number,
        min: 1,
        max: 5,
        default: null
      },
      notes: String
    },
    
    // Timestamps
    savedAt: {
      type: Date,
      default: Date.now
    },
    
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }
);

// Unique constraint - user can only save a tutorial once
userSavedTutorialSchema.index({ userId: 1, tutorialId: 1 }, { unique: true });
userSavedTutorialSchema.index({ userId: 1 });

export default mongoose.model('UserSavedTutorial', userSavedTutorialSchema);

