import { validatePlatform } from "../lib/validation.js";
import { monitoredContentRepository } from "../repositories/index.js";

function standardError(res, status, message, code) {
  return res.status(status).json({
    success: false,
    message,
    code: code || "DASHBOARD_FAILED",
  });
}

function sumInt(values) {
  return values.reduce(
    (acc, v) => acc + (Number.isFinite(Number(v)) ? Number(v) : 0),
    0,
  );
}

export async function getDashboardController(req, res, platformInput) {
  try {
    const platform = validatePlatform(platformInput);
    const items = await monitoredContentRepository.findMonitoredContentByUserId(
      req.auth.userId,
    );

    const filtered = items.filter((i) => i.platform === platform.toUpperCase());

    // Phase1: dashboard is computed from latest stored metrics.
    // If no metrics exist yet, everything defaults to 0.
    const latestMetrics = filtered.map((i) => i.engagementMetrics?.[0] || null);

    const totals = {
      totalContent: filtered.length,
      totalLikes: sumInt(latestMetrics.map((m) => m?.likes ?? 0)),
      totalComments: sumInt(latestMetrics.map((m) => m?.comments ?? 0)),
      totalShares: sumInt(latestMetrics.map((m) => m?.shares ?? 0)),
      totalSaves: sumInt(latestMetrics.map((m) => m?.saves ?? 0)),
      totalViews: sumInt(latestMetrics.map((m) => m?.views ?? 0)),
      totalReach: sumInt(latestMetrics.map((m) => m?.reach ?? 0)),
      totalEngagement: sumInt(
        latestMetrics.map((m) => m?.totalEngagement ?? 0),
      ),
    };

    return res.json({ success: true, platform, ...totals });
  } catch (error) {
    return standardError(
      res,
      400,
      error instanceof Error ? error.message : "Unable to fetch dashboard.",
      "DASHBOARD_FAILED",
    );
  }
}
