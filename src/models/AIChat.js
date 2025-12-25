import mongoose from "mongoose";

const aiChatSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, required: true },
    response: { type: String, required: true },
    context: { type: String, default: 'general' }, // 'course', 'tutorial', or 'general'
    contextTitle: { type: String }, // Course/tutorial title
    contextId: { type: String }, // Course/tutorial ID
    contentScope: { type: String }, // The content being studied
  },
  { timestamps: true }
);

const AIChat = mongoose.model("AIChat", aiChatSchema);
export default AIChat;

