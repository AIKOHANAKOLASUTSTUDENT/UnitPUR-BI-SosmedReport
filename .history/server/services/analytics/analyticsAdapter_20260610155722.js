// Phase 1 analytics adapter (compatibility layer)
//
// IMPORTANT:
// - This adapter delegates to the existing analytics implementation in server/lib/providers.js.
// - server/lib/providers.js currently contains PLACEHOLDER / HEURISTIC / fallback logic
//   (e.g., placeholder thumbnails and forced metric defaults like saves/shares/reach/impressions).
// - This adapter isolates that behavior so future Phase 2 replacement does NOT require
//   changes to controllers/routes/DB schema.
//
// TODO(Phase2): Replace this file with official platform API metric extraction.

import { monitoredContentRepository } from "../../repositories/index.js";
import { socialAccountsRepository } from "../../repositories/index.js";
import { normalizePlatformKey } from "../../lib/validation.js";

// Phase1 adapter DOES NOT execute analytics.
// It exists solely to keep architecture/routing production-ready while avoiding
// placeholder/heuristic metric logic (which currently lives in server/lib/providers.js).

export async function runPlaceholderAnalyticsAdapter({ userId, platform }) {
  // Load monitored content for user.
  const monitored =
    await monitoredContentRepository.findMonitoredContentByUserId(userId);

  const platforms = platform
    ? [platform]
    : Array.from(new Set(monitored.map((m) => m.platform)));

  const analysesSaved = [];

  for (const p of platforms) {
    const normalized = typeof p === "string" ? normalizePlatformKey(p) : p;
    const platformEnum = normalized.toUpperCase();

    // Fetch monitored content for this platform.
    const contents = monitored.filter((m) => m.platform === platformEnum);
    if (!contents.length) continue;

    // Resolve connected social account for the platform.
    // The existing storage in server/lib/store.js is system-user based.
    // For Phase1 adapter, we only use DB tokens via socialAccountsRepository.
    const account = await socialAccountsRepository.findSocialAccountByPlatform(
      userId,
      platformEnum,
    );

    if (!account) {
      analysesSaved.push({ platform: normalized, count: 0, skipped: true });
      continue;
    }

    // Build rows for providers.js
    const rows = contents.map((c) => ({
      url: c.contentUrl,
      contentType: c.contentType || undefined,
    }));

    const connection = {
      connected: true,
      accessToken: account.accessToken,
      refreshToken: account.refreshToken,
      expiresAt: account.expiresAt,
      scopes: [],
    };

    // providers.js expects raw connection tokens.
    // account.accessToken is encrypted in DB in other parts; for Phase1 adapter,
    // we delegate to the existing store/provider pipeline.

    // TODO(Phase2): Use the same encryption/decryption approach correctly per account.
    // For now, use the system-user pipeline to keep frontend working.

    const sysPlatformConnection = null;

    // Use existing platform analysis pipeline only when called via legacy route.
    // Phase1 new endpoint returns a safe placeholder response without crashing.
    analysesSaved.push({
      platform: normalized,
      count: contents.length,
      analyses: [],
      note: "Phase1 placeholder adapter: analytics run is not executed here to avoid mixing encrypted token formats. Use legacy /api/platforms/:platform/analyze for now.",
    });
  }

  return { saved: analysesSaved };
}
