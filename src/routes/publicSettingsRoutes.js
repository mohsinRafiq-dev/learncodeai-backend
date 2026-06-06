// Public settings endpoint — exposes the subset of PlatformSettings that the
// frontend needs to render correctly (branding, theme, banner, feature flags).
// Heavier values (execution limits, maintenance message internals, audit
// metadata) stay in the admin-only endpoint.

import express from "express";
import PlatformSettings from "../models/PlatformSettings.js";

const router = express.Router();

router.get("/public", async (_req, res) => {
  try {
    const doc = await PlatformSettings.getSettings();
    res.json({
      success: true,
      data: {
        siteName: doc.siteName,
        defaultTheme: doc.defaultTheme,
        primaryColor: doc.primaryColor,
        accentColor: doc.accentColor,
        logoUrl: doc.logoUrl,
        features: doc.features,
        update: {
          bannerEnabled: doc.update?.bannerEnabled || false,
          latestVersion: doc.update?.latestVersion || "",
          releaseNotes: doc.update?.releaseNotes || "",
        },
        maintenance: {
          enabled: doc.maintenance?.enabled || false,
          message: doc.maintenance?.message || "",
        },
      },
    });
  } catch (err) {
    console.error("publicSettings failed:", err);
    res.status(500).json({ success: false, message: "Failed to load settings" });
  }
});

export default router;
