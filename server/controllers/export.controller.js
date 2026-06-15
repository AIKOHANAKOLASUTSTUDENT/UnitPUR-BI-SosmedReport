import { z } from "zod";
import { validatePlatform } from "../lib/validation.js";
import { buildExportFile } from "../lib/export.js";
import { monitoredContentRepository } from "../repositories/index.js";
import * as XLSX from "xlsx";

function standardError(res, status, message, code) {
  return res.status(status).json({
    success: false,
    message,
    code: code || "EXPORT_FAILED",
  });
}

function getExportFieldsForPlatform(platform) {
  // Phase1: Excel/CSV export fields aligned to spec; if metrics missing => 0.
  switch (platform) {
    case "instagram":
      return [
        "contentUrl",
        "title",
        "likes",
        "comments",
        "shares",
        "saves",
        "views",
        "reach",
        "totalEngagement",
      ];
    case "facebook":
      return [
        "contentUrl",
        "title",
        "likes",
        "comments",
        "shares",
        "saves",
        "views",
        "reach",
        "totalEngagement",
      ];
    case "tiktok":
      return [
        "contentUrl",
        "title",
        "likes",
        "comments",
        "shares",
        "favorites",
        "views",
        "reach",
        "totalEngagement",
      ];
    case "youtube":
      return [
        "contentUrl",
        "title",
        "likes",
        "comments",
        "views",
        "shares",
        "reach",
        "totalEngagement",
      ];
    default:
      return ["contentUrl", "title", "totalEngagement"];
  }
}

export async function exportExcelController(req, res) {
  try {
    const platform = validatePlatform(req.params.platform);
    const items = await monitoredContentRepository.findMonitoredContentByUserId(
      req.auth.userId,
    );
    const filtered = items.filter((i) => i.platform === platform.toUpperCase());

    const format = "xlsx";
    const fields = getExportFieldsForPlatform(platform);

    // Map to export row shape expected by buildExportFile.
    const rows = filtered.map((i) => {
      const m = i.engagementMetrics?.[0];
      return {
        contentUrl: i.contentUrl,
        title: i.title || null,
        likes: m?.likes ?? 0,
        comments: m?.comments ?? 0,
        shares: m?.shares ?? 0,
        saves: m?.saves ?? 0,
        favorites: m?.favorites ?? m?.saves ?? 0,
        views: m?.views ?? 0,
        reach: m?.reach ?? 0,
        totalEngagement: m?.totalEngagement ?? 0,
      };
    });

    const file = buildExportFile(platform, format, fields, rows);

    res.setHeader("Content-Type", file.contentType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${file.filename}"`,
    );
    return res.send(file.buffer);
  } catch (error) {
    return standardError(
      res,
      400,
      error instanceof Error ? error.message : "Unable to export.",
      "EXPORT_EXCEL_FAILED",
    );
  }
}

export async function exportCsvController(req, res) {
  try {
    const platform = validatePlatform(req.params.platform);
    const items = await monitoredContentRepository.findMonitoredContentByUserId(
      req.auth.userId,
    );
    const filtered = items.filter((i) => i.platform === platform.toUpperCase());

    const format = "csv";
    const fields = getExportFieldsForPlatform(platform);

    const rows = filtered.map((i) => {
      const m = i.engagementMetrics?.[0];
      return {
        contentUrl: i.contentUrl,
        title: i.title || null,
        likes: m?.likes ?? 0,
        comments: m?.comments ?? 0,
        shares: m?.shares ?? 0,
        saves: m?.saves ?? 0,
        favorites: m?.favorites ?? m?.saves ?? 0,
        views: m?.views ?? 0,
        reach: m?.reach ?? 0,
        totalEngagement: m?.totalEngagement ?? 0,
      };
    });

    const file = buildExportFile(platform, format, fields, rows);

    res.setHeader("Content-Type", file.contentType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${file.filename}"`,
    );
    return res.send(file.buffer);
  } catch (error) {
    return standardError(
      res,
      400,
      error instanceof Error ? error.message : "Unable to export.",
      "EXPORT_CSV_FAILED",
    );
  }
}
