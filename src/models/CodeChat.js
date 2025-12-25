import mongoose from "mongoose";

const codeChatSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, required: true },
    response: { type: String, required: true },
    messageType: { type: String, default: 'question' }, // 'question', 'error-help', 'problem-help', 'regular'
    code: { type: String }, // The code context when the message was sent
    language: { type: String, default: 'python' }, // Programming language
    error: { type: String }, // Any error being discussed
    problems: [{ // Code problems/issues
      severity: { type: String, enum: ['error', 'warning', 'info'] },
      message: String,
      line: Number,
      column: Number
    }]
  },
  { timestamps: true }
);

const CodeChat = mongoose.model("CodeChat", codeChatSchema);
export default CodeChat;
