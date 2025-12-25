import mongoose from "mongoose";

const codeSnippetSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, default: "Untitled Code" },
    language: { type: String, required: true },
    code: { type: String, required: true },
    output: { type: String },
    sharedLink: { type: String, default: null },
    isPublic: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const CodeSnippet = mongoose.model("CodeSnippet", codeSnippetSchema);
export default CodeSnippet;

