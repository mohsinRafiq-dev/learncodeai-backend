import mongoose from "mongoose";

const platformSettingsSchema = new mongoose.Schema(
  {
    // Branding / theme
    siteName: { type: String, default: "LearnCode AI" },
    defaultTheme: {
      type: String,
      enum: ["dark", "light", "system"],
      default: "dark",
    },
    primaryColor: { type: String, default: "#8b5cf6" },
    accentColor: { type: String, default: "#00b4d8" },
    logoUrl: { type: String, default: "" },

    // Feature toggles
    features: {
      registrationOpen: { type: Boolean, default: true },
      googleOAuth: { type: Boolean, default: true },
      githubOAuth: { type: Boolean, default: true },
      aiAssistantEnabled: { type: Boolean, default: true },
      discussionsEnabled: { type: Boolean, default: true },
      gamificationEnabled: { type: Boolean, default: true },
      certificatesEnabled: { type: Boolean, default: true },
    },

    // Maintenance
    maintenance: {
      enabled: { type: Boolean, default: false },
      message: {
        type: String,
        default: "We are performing scheduled maintenance. Please check back soon.",
      },
    },

    // Update / version banner
    update: {
      currentVersion: { type: String, default: "1.0.0" },
      latestVersion: { type: String, default: "1.0.0" },
      releaseNotes: { type: String, default: "" },
      bannerEnabled: { type: Boolean, default: false },
    },

    // Code execution limits
    execution: {
      memoryLimitMb: { type: Number, default: 128 },
      cpuLimit: { type: Number, default: 0.5 },
      timeoutSeconds: { type: Number, default: 10 },
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

// Singleton helpers
platformSettingsSchema.statics.getSettings = async function () {
  let doc = await this.findOne();
  if (!doc) doc = await this.create({});
  return doc;
};

const PlatformSettings = mongoose.model("PlatformSettings", platformSettingsSchema);
export default PlatformSettings;
