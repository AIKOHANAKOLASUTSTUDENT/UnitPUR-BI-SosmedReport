import type { PlatformAuth } from "../types";

export type PlatformKey = keyof PlatformAuth;

export function parseContentUrls(input: string): string[] {
  const seen = new Set<string>();
  const urls = input
    .split(/[\s,\n]+/)
    .map((value) => value.trim())
    .filter((value) => value.length > 0)
    .filter((value) => {
      if (seen.has(value)) {
        return false;
      }
      seen.add(value);
      return true;
    });

  return urls;
}

export function calculateTotalEngagement(row: Record<string, unknown>) {
  const values = [
    row.likes,
    row.comments,
    row.shares,
    row.reposts,
    row.saves,
    row.favorites,
    row.views,
    row.reach,
  ];

  return values.reduce(
    (total, value) =>
      total + (Number.isFinite(Number(value)) ? Number(value) : 0),
    0,
  );
}

export function normalizePlatformLabel(platform: PlatformKey) {
  return platform.charAt(0).toUpperCase() + platform.slice(1);
}
