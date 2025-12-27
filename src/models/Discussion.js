import mongoose from "mongoose";

// Code snippet schema for embedded code in discussions
const codeSnippetSchema = new mongoose.Schema({
  language: {
    type: String,
    enum: [
      "python",
      "javascript",
      "cpp",
      "java",
      "html",
      "css",
      "sql",
      "bash",
      "other",
    ],
    default: "javascript",
  },
  code: {
    type: String,
    required: true,
    maxlength: 10000,
  },
  filename: String,
});

// Comment/Answer schema
const commentSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 10000,
    },
    codeSnippets: [codeSnippetSchema],
    upvotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    downvotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    isAcceptedAnswer: {
      type: Boolean,
      default: false,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: Date,
    // Moderation
    isHidden: {
      type: Boolean,
      default: false,
    },
    hiddenReason: String,
    hiddenBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reports: [
      {
        reporter: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        reason: {
          type: String,
          enum: ["spam", "inappropriate", "harassment", "off-topic", "other"],
        },
        description: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

// Virtual for vote score
commentSchema.virtual("voteScore").get(function () {
  return (this.upvotes?.length || 0) - (this.downvotes?.length || 0);
});

// Main Discussion schema
const discussionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    content: {
      type: String,
      required: true,
      maxlength: 20000,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Topic/Category
    topic: {
      type: String,
      required: true,
      enum: [
        "python",
        "javascript",
        "cpp",
        "java",
        "web-development",
        "data-structures",
        "algorithms",
        "databases",
        "general",
        "career",
        "project-help",
        "code-review",
      ],
      default: "general",
    },
    // Tags for more specific categorization
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    // Discussion type
    type: {
      type: String,
      enum: ["question", "discussion", "tutorial", "announcement"],
      default: "question",
    },
    // Code snippets in the original post
    codeSnippets: [codeSnippetSchema],
    // Answers/Comments
    comments: [commentSchema],
    // Voting
    upvotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    downvotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    // Stats
    viewCount: {
      type: Number,
      default: 0,
    },
    // Status
    status: {
      type: String,
      enum: ["open", "answered", "closed"],
      default: "open",
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
    // Moderation
    isHidden: {
      type: Boolean,
      default: false,
    },
    hiddenReason: String,
    hiddenBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reports: [
      {
        reporter: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        reason: {
          type: String,
          enum: ["spam", "inappropriate", "harassment", "off-topic", "other"],
        },
        description: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Accepted answer reference
    acceptedAnswer: {
      type: mongoose.Schema.Types.ObjectId,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtuals
discussionSchema.virtual("voteScore").get(function () {
  return (this.upvotes?.length || 0) - (this.downvotes?.length || 0);
});

discussionSchema.virtual("commentCount").get(function () {
  return this.comments?.length || 0;
});

discussionSchema.virtual("answerCount").get(function () {
  return this.comments?.filter((c) => !c.isHidden).length || 0;
});

// Indexes for efficient querying
discussionSchema.index({ topic: 1, createdAt: -1 });
discussionSchema.index({ author: 1 });
discussionSchema.index({ tags: 1 });
discussionSchema.index({ status: 1 });
discussionSchema.index({ title: "text", content: "text" });

// Pre-save hook to update status when answer is accepted
discussionSchema.pre("save", function (next) {
  if (this.acceptedAnswer) {
    this.status = "answered";
  }
  next();
});

const Discussion = mongoose.model("Discussion", discussionSchema);
export default Discussion;
