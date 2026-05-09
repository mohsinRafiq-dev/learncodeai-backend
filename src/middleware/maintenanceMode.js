import PlatformSettings from "../models/PlatformSettings.js";

let cached = { value: null, fetchedAt: 0 };
const TTL_MS = 30 * 1000;

async function getSettings() {
  const now = Date.now();
  if (cached.value && now - cached.fetchedAt < TTL_MS) return cached.value;
  try {
    const s = await PlatformSettings.getSettings();
    cached = { value: s, fetchedAt: now };
    return s;
  } catch {
    return null;
  }
}

// Bypass paths even when maintenance is on
const BYPASS_PREFIXES = [
  "/api/auth/", // admins must still log in
  "/api/admin/", // admin tools must remain available
  "/uploads/",
];

export function maintenanceMode(req, res, next) {
  const path = req.originalUrl || req.url || "";
  if (BYPASS_PREFIXES.some((p) => path.startsWith(p))) return next();

  getSettings().then((settings) => {
    if (!settings?.maintenance?.enabled) return next();
    if (req.user?.role === "admin") return next();
    return res.status(503).json({
      success: false,
      maintenance: true,
      message: settings.maintenance.message || "We are performing scheduled maintenance.",
    });
  }).catch(() => next());
}

export function invalidateMaintenanceCache() {
  cached = { value: null, fetchedAt: 0 };
}
