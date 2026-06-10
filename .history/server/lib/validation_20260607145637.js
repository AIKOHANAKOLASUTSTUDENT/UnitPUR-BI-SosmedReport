const PLATFORM_KEYS = new Set(["instagram", "facebook", "tiktok", "youtube"]);

const contentPatterns = {
  instagram: [/instagram\.com\/(p|reel)\//i],
  facebook: [/facebook\.com\/.+/i],
  tiktok: [/tiktok\.com\/.+\/video\//i],
  youtube: [
    /youtube\.com\/watch\?v=/i,
    /youtube\.com\/shorts\//i,
    /youtu\.be\//i,
  ],
};

export function normalizePlatformKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

export function validatePlatform(value) {
  const platform = normalizePlatformKey(value);
  if (!PLATFORM_KEYS.has(platform)) {
    throw new Error("Unsupported platform.");
  }

  return platform;
}

export function validateContentUrl(platform, url) {
  const normalizedPlatform = validatePlatform(platform);
  if (!String(url || "").trim()) {
    throw new Error("Invalid content URL detected.");
  }

  const patterns = contentPatterns[normalizedPlatform];
  if (!patterns.some((pattern) => pattern.test(url))) {
    throw new Error("Invalid content URL detected.");
  }

  return url.trim();
}

export function parseContentRows(platform, rows) {
  const normalizedPlatform = validatePlatform(platform);
  const seen = new Set();
  const parsed = [];

  for (const row of rows) {
    const url = validateContentUrl(normalizedPlatform, row.url);
    if (seen.has(url)) {
      continue;
    }
    seen.add(url);
    parsed.push({
      url,
      contentType: row.contentType || null,
    });
  }

  if (!parsed.length) {
    throw new Error("Invalid content URL detected.");
  }

  return parsed;
}
