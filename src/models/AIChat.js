import mongoose from "mongoose";

const aiChatSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    conversationId: { type: String, index: true, default: null },
    message: { type: String, required: true },
    response: { type: String, required: true },
    context: { type: String, default: 'general' },
    contextTitle: { type: String },
    contextId: { type: String },
    contentScope: { type: String },
    promptTokens: { type: Number, default: 0 },
    responseTokens: { type: Number, default: 0 },
  },
  { timestamps: true }
);

aiChatSchema.index({ user: 1, conversationId: 1, createdAt: 1 });

const AIChat = mongoose.model("AIChat", aiChatSchema);
export default AIChat;

