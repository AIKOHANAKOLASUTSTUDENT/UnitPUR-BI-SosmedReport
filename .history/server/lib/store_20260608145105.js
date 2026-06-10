import { encryptToken, decryptToken } from './crypto.js';
import {
  usersRepository,
  socialAccountsRepository,
  monitoredContentRepository,
  engagementMetricsRepository,
} from '../repositories/index.js';

const DEFAULT_USER_EMAIL = process.env.SYSTEM_USER_EMAIL || 'owner@local.dev';

const PLATFORM_TO_ENUM = {
  instagram: 'INSTAGRAM',
  facebook: 'FACEBOOK',
  tiktok: 'TIKTOK',
  youtube: 'YOUTUBE',
};

const ENUM_TO_PLATFORM = {
  INSTAGRAM: 'instagram',
  FACEBOOK: 'facebook',
  TIKTOK: 'tiktok',
  YOUTUBE: 'youtube',
};

const CONTENT_TYPE_TO_ENUM = {
  Post: 'POST',
  Reel: 'REEL',
  Story: 'STORY',
  Video: 'VIDEO',
  Short: 'SHORT',
  Other: 'OTHER',
};

const CONTENT_ENUM_TO_LABEL = {
  POST: 'Post',
  REEL: 'Reel',
  STORY: 'Story',
  VIDEO: 'Video',
  SHORT: 'Short',
  OTHER: 'Post',
};

function normalizePlatform(platform) {
  const normalized = String(platform || '').trim().toLowerCase();
  if (!PLATFORM_TO_ENUM[normalized]) {
    throw new Error('Unsupported platform.');
  }

  return normalized;
}

function toPlatformEnum(platform) {
  return PLATFORM_TO_ENUM[normalizePlatform(platform)];
}

function toPlatformLabel(platformEnum) {
  return ENUM_TO_PLATFORM[platformEnum] || 'instagram';
}

function toAccountTypeEnum(value) {
  const normalized = String(value || '').trim().toUpperCase();
  return normalized || null;
}

function toContentTypeEnum(value) {
  const normalized = String(value || '').trim();
  return CONTENT_TYPE_TO_ENUM[normalized] || 'OTHER';
}

function toContentTypeLabel(value) {
  const normalized = String(value || '').trim().toUpperCase();
  return CONTENT_ENUM_TO_LABEL[normalized] || 'Post';
}

function toInt(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : 0;
}

function computeTotalEngagement(row) {
  return [
    row.likes,
    row.comments,
    row.shares,
    row.reposts,
    row.saves,
    row.favorites,
    row.views,
    row.reach,
  ].reduce((sum, value) => sum + toInt(value), 0);
}

async function getSystemUser() {
  const existingUser = await usersRepository.findUserByEmail(DEFAULT_USER_EMAIL);
  if (existingUser) {
    return existingUser;
  }

  return usersRepository.createUser({
    email: DEFAULT_USER_EMAIL,
    displayName: 'System Owner',
    passwordHash: null,
  });
}

function maskConnectionRecord(record) {
  if (!record) {
    return null;
  }

  return {
    id: record.id,
    platform: toPlatformLabel(record.platform),
    connected: true,
    verified: true,
    accountId: record.accountId,
    accountName: record.accountName,
    accountType: record.accountType || null,
    accessToken: decryptToken(record.accessToken),
    refreshToken: decryptToken(record.refreshToken),
    expiresAt: record.expiresAt ? record.expiresAt.toISOString() : null,
    connectedAt: record.connectedAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function mapMetricSnapshot(metric) {
  if (!metric) {
    return null;
  }

  return {
    ...metric,
    watchTimeHours: metric.watchTimeHours ? Number(metric.watchTimeHours) : 0,
    rawPayload: metric.rawPayload || {},
  };
}

function mapContentRow(record) {
  const latestMetric = mapMetricSnapshot(record.engagementMetrics?.[0]);
  const payload = latestMetric?.rawPayload || {};
  const analyzedAt = latestMetric?.capturedAt
    ? latestMetric.capturedAt.toISOString()
    : record.lastSyncedAt
      ? record.lastSyncedAt.toISOString()
      : record.createdAt.toISOString();
  const base = {
    id: Number(record.createdAt.getTime()),
    link: record.contentUrl,
    analyzedAt,
  };

  switch (record.platform) {
    case 'INSTAGRAM':
      return {
        ...base,
        contentType: toContentTypeLabel(record.contentType),
        thumbnail: payload.thumbnail || payload.image || 'https://placehold.co/80x80?text=IG',
        caption: payload.caption || record.title || 'Instagram content',
        likes: latestMetric?.likes || 0,
        comments: latestMetric?.comments || 0,
        saves: latestMetric?.saves || 0,
        shares: latestMetric?.shares || 0,
        reach: latestMetric?.reach || 0,
        impressions: latestMetric?.impressions || 0,
        totalEngagement: latestMetric?.totalEngagement || computeTotalEngagement(latestMetric || {}),
      };
    case 'TIKTOK':
      return {
        ...base,
        thumbnail: payload.thumbnail || payload.coverImageUrl || 'https://placehold.co/80x80?text=TT',
        title: payload.title || record.title || 'TikTok video',
        likes: latestMetric?.likes || 0,
        comments: latestMetric?.comments || 0,
        shares: latestMetric?.shares || 0,
        views: latestMetric?.views || 0,
        saves: latestMetric?.favorites || latestMetric?.saves || 0,
        totalEngagement: latestMetric?.totalEngagement || computeTotalEngagement(latestMetric || {}),
      };
    case 'YOUTUBE':
      return {
        ...base,
        contentType: toContentTypeLabel(record.contentType),
        thumbnail: payload.thumbnail || 'https://placehold.co/80x80?text=YT',
        title: payload.title || record.title || 'YouTube video',
        likes: latestMetric?.likes || 0,
        comments: latestMetric?.comments || 0,
        views: latestMetric?.views || 0,
        shares: latestMetric?.shares || 0,
        watchTimeHours: latestMetric?.watchTimeHours || 0,
        subscribersGained: toInt(payload.subscribersGained),
        totalEngagement: latestMetric?.totalEngagement || computeTotalEngagement(latestMetric || {}),
      };
    case 'FACEBOOK':
      return {
        ...base,
        contentType: toContentTypeLabel(record.contentType),
        thumbnail: payload.thumbnail || payload.picture || 'https://placehold.co/80x80?text=FB',
        caption: payload.caption || record.title || 'Facebook content',
        likes: latestMetric?.likes || 0,
        comments: latestMetric?.comments || 0,
        shares: latestMetric?.shares || 0,
        reactions: toInt(payload.reactions ?? latestMetric?.likes),
        reach: latestMetric?.reach || 0,
        impressions: latestMetric?.impressions || 0,
        totalEngagement: latestMetric?.totalEngagement || computeTotalEngagement(latestMetric || {}),
      };
    default:
      return base;
  }
}

export async function bootstrapState() {
  const user = await getSystemUser();
  const socialAccounts = await socialAccountsRepository.findSocialAccountsByUserId(user.id);
  const monitoredContent = await monitoredContentRepository.findMonitoredContentByUserId(user.id);

  const connections = {
    instagram: null,
    facebook: null,
    tiktok: null,
    youtube: null,
  };

  for (const account of socialAccounts) {
    const platform = toPlatformLabel(account.platform);
    connections[platform] = maskConnectionRecord(account);
  }

  const groupedContent = monitoredContent.reduce((accumulator, record) => {
    const platform = toPlatformLabel(record.platform);
    if (!accumulator[platform]) {
      accumulator[platform] = [];
    }
    accumulator[platform].push(record);
    return accumulator;
  }, { instagram: [], facebook: [], tiktok: [], youtube: [] });

  return {
    platformAuth: {
      instagram: Boolean(connections.instagram),
      facebook: Boolean(connections.facebook),
      tiktok: Boolean(connections.tiktok),
      youtube: Boolean(connections.youtube),
    },
    platformConnections: connections,
    instagramPosts: groupedContent.instagram.map(mapContentRow),
    facebookPosts: groupedContent.facebook.map(mapContentRow),
    tiktokPosts: groupedContent.tiktok.map(mapContentRow),
    youtubePosts: groupedContent.youtube.map(mapContentRow),
  };
}

export async function getConnection(platform) {
  const user = await getSystemUser();
  const normalizedPlatform = normalizePlatform(platform);
  const account = await socialAccountsRepository.findSocialAccountByPlatform(
    user.id,
    toPlatformEnum(normalizedPlatform),
  );

  return maskConnectionRecord(account);
}

export async function saveConnection(platform, connection) {
  const user = await getSystemUser();
  const normalizedPlatform = normalizePlatform(platform);

  if (!connection) {
    const existingAccounts = await socialAccountsRepository.findSocialAccountsByUserId(user.id);
    const matches = existingAccounts.filter(
      (account) => account.platform === toPlatformEnum(normalizedPlatform),
    );

    for (const account of matches) {
      await monitoredContentRepository.deleteMonitoredContentBySocialAccountId(account.id);
      await socialAccountsRepository.deleteSocialAccount(account.id);
    }

    return null;
  }

  const platformEnum = toPlatformEnum(normalizedPlatform);
  const accountId = String(connection.accountId || `${normalizedPlatform}-account`);
  const encryptedAccessToken = encryptToken(connection.accessToken || '');
  const encryptedRefreshToken = connection.refreshToken
    ? encryptToken(connection.refreshToken)
    : null;

  return socialAccountsRepository.upsertSocialAccount({
    userId: user.id,
    platform: platformEnum,
    accountId,
    accountName: connection.accountName || `${normalizedPlatform} account`,
    accountType: toAccountTypeEnum(connection.accountType),
    accessToken: encryptedAccessToken,
    refreshToken: encryptedRefreshToken,
    expiresAt: connection.expiresAt ? new Date(connection.expiresAt) : null,
  });
}

export async function clearPlatformData(platform) {
  const user = await getSystemUser();
  const normalizedPlatform = normalizePlatform(platform);
  const accounts = await socialAccountsRepository.findSocialAccountsByUserId(user.id);
  const matches = accounts.filter(
    (account) => account.platform === toPlatformEnum(normalizedPlatform),
  );

  for (const account of matches) {
    await monitoredContentRepository.deleteMonitoredContentBySocialAccountId(account.id);
  }
}

export async function savePlatformData(platform, rows) {
  const user = await getSystemUser();
  const normalizedPlatform = normalizePlatform(platform);
  const account = await socialAccountsRepository.findSocialAccountByPlatform(
    user.id,
    toPlatformEnum(normalizedPlatform),
  );

  if (!account) {
    throw new Error('No connected account found for this platform.');
  }

  const savedRows = [];

  for (const row of rows) {
    const contentUrl = String(row.link || row.url || '').trim();
    if (!contentUrl) {
      continue;
    }

    const content = await monitoredContentRepository.upsertMonitoredContent({
      userId: user.id,
      socialAccountId: account.id,
      platform: account.platform,
      contentId: String(row.id || row.contentId || contentUrl),
      contentUrl,
      contentType: toContentTypeEnum(row.contentType),
      title: row.title || row.caption || null,
      status: 'SYNCED',
      publishedAt: row.publishedAt ? new Date(row.publishedAt) : null,
      lastSyncedAt: new Date(),
    });

    const metric = await engagementMetricsRepository.createEngagementMetric({
      monitoredContentId: content.id,
      likes: toInt(row.likes),
      comments: toInt(row.comments),
      shares: toInt(row.shares),
      saves: toInt(row.saves),
      favorites: toInt(row.favorites),
      views: toInt(row.views),
      reach: toInt(row.reach),
      impressions: toInt(row.impressions),
      reposts: toInt(row.reposts),
      watchTimeHours: row.watchTimeHours ?? null,
      totalEngagement: toInt(
        row.totalEngagement ?? computeTotalEngagement(row),
      ),
      rawPayload: row,
    });

    savedRows.push(mapContentRow({ ...content, engagementMetrics: [metric] }));
  }

  return savedRows;
}

export async function listPlatformData(platform) {
  const user = await getSystemUser();
  const normalizedPlatform = normalizePlatform(platform);
  const records = await monitoredContentRepository.findMonitoredContentByUserId(user.id);

  return records
    .filter((record) => record.platform === toPlatformEnum(normalizedPlatform))
    .map(mapContentRow)
    .sort((a, b) => new Date(b.analyzedAt).getTime() - new Date(a.analyzedAt).getTime());
}
