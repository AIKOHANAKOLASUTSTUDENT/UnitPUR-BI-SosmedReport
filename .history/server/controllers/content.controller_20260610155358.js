import { z } from "zod";
import {
  validateContentUrl,
  parseContentRows,
  validatePlatform,
} from "../lib/validation.js";
import {
  socialAccountsRepository,
  monitoredContentRepository,
} from "../repositories/index.js";

function standardError(res, status, message, code) {
  return res.status(status).json({
    success: false,
    message,
    code: code || "BAD_REQUEST",
  });
}

function parseUrlInput(input) {
  // Supports: single URL, multiple URLs (comma/space/newline separated)
  const raw = String(input || "").trim();
  if (!raw) return [];

  // Normalize separators to newline
  const normalized = raw
    .replace(/,/g, "\n")
    .replace(/\r/g, "\n")
    .split(/\n|\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  return normalized;
}

function autoDetectPlatformFromUrl(url) {
  // Uses existing validateContentUrl patterns via attempting validation for each platform
  const candidates = ["instagram", "facebook", "tiktok", "youtube"];
  for (const p of candidates) {
    try {
      validateContentUrl(p, url);
      return p;
    } catch {
      // continue
    }
  }
  return null;
}

export async function addContentController(req, res) {
  try {
    const schema = z.object({
      // frontend may send either platform explicitly or urls as url/content/urls
      platform: z.string().optional(),
      url: z.string().optional(),
      urls: z.string().optional(),
      contentUrl: z.string().optional(),
    });

    const body = schema.parse(req.body || {});

    const urlInput = body.urls || body.url || body.contentUrl;
    const urls = parseUrlInput(urlInput);

    if (!urls.length) {
      return standardError(
        res,
        400,
        "No content URLs provided.",
        "INVALID_URL",
      );
    }

    // Deduplicate early
    const deduped = Array.from(new Set(urls));

    // Validate + auto-detect
    let platform = body.platform ? validatePlatform(body.platform) : null;

    if (!platform) {
      // If platform not provided, auto-detect per URL.
      const detected = new Set();
      for (const u of deduped) {
        const p = autoDetectPlatformFromUrl(u);
        if (!p) {
          return standardError(
            res,
            400,
            `Invalid content URL detected.`,
            "INVALID_URL",
          );
        }
        detected.add(p);
      }
      if (detected.size !== 1) {
        return standardError(
          res,
          400,
          "Multiple platforms detected in a single request. Split requests by platform.",
          "MULTI_PLATFORM",
        );
      }
      platform = Array.from(detected)[0];
    } else {
      // platform provided: validate every URL against that platform
      for (const u of deduped) {
        validateContentUrl(platform, u);
      }
    }

    const rows = deduped.map((u) => ({ url: u }));
    const parsed = parseContentRows(platform, rows);

    // Find the canonical social account connection for this platform
    const account = await socialAccountsRepository.findSocialAccountByPlatform(
      req.auth.userId,
      platform.toUpperCase(), // repository expects enum Platform
    );

    if (!account) {
      return standardError(
        res,
        401,
        "Session expired. Please reconnect your account.",
        "SESSION_EXPIRED",
      );
    }

    const created = [];
    for (const row of parsed) {
      const content = await monitoredContentRepository.upsertMonitoredContent({
        userId: req.auth.userId,
        socialAccountId: account.id,
        platform,
        contentUrl: row.url,
        contentType: row.contentType,
        title: null,
      });
      created.push(content);
    }

    return res.json({
      success: true,
      message: "Content added.",
      content: created,
    });
  } catch (error) {
    return standardError(
      res,
      error?.name === "ZodError" ? 400 : 500,
      error instanceof Error ? error.message : "Unable to add content.",
      "CONTENT_ADD_FAILED",
    );
  }
}

export async function listContentController(req, res) {
  try {
    const platform = req.query.platform
      ? validatePlatform(String(req.query.platform))
      : null;
    // Repository currently supports listing by userId; platform filtering is applied in-memory.
    const all = await monitoredContentRepository.findMonitoredContentByUserId(
      req.auth.userId,
    );
    const items = platform ? all.filter((i) => i.platform === platform) : all;

    return res.json({
      success: true,
      content: items,
    });
  } catch (error) {
    return standardError(
      res,
      400,
      error instanceof Error ? error.message : "Unable to fetch content.",
      "CONTENT_LIST_FAILED",
    );
  }
}

export async function deleteContentController(req, res) {
  try {
    const id = String(req.params.id || "").trim();
    if (!id)
      return standardError(res, 400, "Missing content id.", "INVALID_ID");

    await monitoredContentRepository.deleteMonitoredContentByIdForUser(
      req.auth.userId,
      id,
    );
    return res.json({ success: true, message: "Content deleted." });
  } catch (error) {
    return standardError(
      res,
      400,
      error instanceof Error ? error.message : "Unable to delete content.",
      "CONTENT_DELETE_FAILED",
    );
  }
}
