import { z } from "zod";
import { validatePlatform } from "../lib/validation.js";
import { runPlaceholderAnalyticsAdapter } from "../services/analytics/analyticsAdapter.js";

function standardError(res, status, message, code) {
  return res.status(status).json({
    success: false,
    message,
    code: code || "ANALYTICS_FAILED",
  });
}

export async function runAnalyticsController(req, res) {
  try {
    const body = z
      .object({
        platform: z
          .enum(["instagram", "facebook", "tiktok", "youtube"])
          .optional(),
      })
      .parse(req.body || {});

    const platform = body.platform ? validatePlatform(body.platform) : null;

    // Placeholder adapter: architecture-only Phase 1.
    // TODO(Phase2): replace placeholder adapter with production integrations per official API.
    const result = await runPlaceholderAnalyticsAdapter({
      userId: req.auth.userId,
      platform,
    });

    return res.json({
      success: true,
      message: "Analytics run complete.",
      ...result,
    });
  } catch (error) {
    return standardError(
      res,
      error?.name === "ZodError" ? 400 : 500,
      error instanceof Error ? error.message : "Unable to run analytics.",
      "ANALYTICS_RUN_FAILED",
    );
  }
}
