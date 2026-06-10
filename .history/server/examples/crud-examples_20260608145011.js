import { connectDatabase, disconnectDatabase } from '../db/prisma.js';
import {
  usersRepository,
  socialAccountsRepository,
  monitoredContentRepository,
  engagementMetricsRepository,
  reportExportsRepository,
} from '../repositories/index.js';

const DEMO_EMAIL = process.env.SYSTEM_USER_EMAIL || 'owner@local.dev';

export async function runCrudExamples() {
  await connectDatabase();

  const user = await usersRepository.createUser({
    email: DEMO_EMAIL,
    displayName: 'Demo Owner',
    passwordHash: 'demo-password-hash',
  });

  const userByEmail = await usersRepository.findUserByEmail(DEMO_EMAIL);
  const updatedUser = await usersRepository.updateUser(user.id, {
    displayName: 'Updated Demo Owner',
  });

  const socialAccount = await socialAccountsRepository.createSocialAccount({
    userId: user.id,
    platform: 'INSTAGRAM',
    accountId: 'ig-123',
    accountName: 'Demo Instagram',
    accountType: 'BUSINESS',
    accessToken: 'encrypted-token-placeholder',
    refreshToken: 'encrypted-refresh-placeholder',
    expiresAt: new Date(Date.now() + 3600_000),
  });

  const socialAccountByPlatform = await socialAccountsRepository.findSocialAccountByPlatform(
    user.id,
    'INSTAGRAM',
  );
  const updatedSocialAccount = await socialAccountsRepository.updateSocialAccount(
    socialAccount.id,
    { accountName: 'Updated Demo Instagram' },
  );

  const content = await monitoredContentRepository.createMonitoredContent({
    userId: user.id,
    socialAccountId: socialAccount.id,
    platform: 'INSTAGRAM',
    contentId: 'media-123',
    contentUrl: 'https://www.instagram.com/p/demo',
    contentType: 'POST',
    title: 'Demo Post',
    status: 'SYNCED',
    publishedAt: new Date(),
    lastSyncedAt: new Date(),
  });

  const contentByUser = await monitoredContentRepository.findMonitoredContentByUserId(
    user.id,
  );
  const updatedContent = await monitoredContentRepository.updateMonitoredContent(
    content.id,
    { title: 'Updated Demo Post' },
  );

  const metric = await engagementMetricsRepository.createEngagementMetric({
    monitoredContentId: content.id,
    likes: 120,
    comments: 14,
    shares: 8,
    saves: 3,
    favorites: 0,
    views: 900,
    reach: 700,
    impressions: 1000,
    reposts: 0,
    totalEngagement: 1800,
    rawPayload: { source: 'example' },
  });

  const latestMetric = await engagementMetricsRepository.findLatestEngagementMetricByContentId(
    content.id,
  );
  const updatedMetric = await engagementMetricsRepository.updateEngagementMetric(metric.id, {
    comments: 15,
  });

  const report = await reportExportsRepository.createReportExport({
    userId: user.id,
    platform: 'INSTAGRAM',
    format: 'CSV',
    fileName: 'instagram_report.csv',
    filePath: '/exports/instagram_report.csv',
    recordsCount: 1,
    filters: { platform: 'instagram' },
    status: 'COMPLETED',
  });

  const reportsByUser = await reportExportsRepository.findReportExportsByUserId(user.id);
  const updatedReport = await reportExportsRepository.updateReportExport(report.id, {
    filePath: '/exports/instagram_report_v2.csv',
  });

  await reportExportsRepository.deleteReportExport(updatedReport.id);
  await engagementMetricsRepository.deleteEngagementMetric(updatedMetric.id);
  await monitoredContentRepository.deleteMonitoredContent(updatedContent.id);
  await socialAccountsRepository.deleteSocialAccount(updatedSocialAccount.id);
  await usersRepository.deleteUser(updatedUser.id);

  await disconnectDatabase();

  return {
    user,
    userByEmail,
    socialAccount,
    socialAccountByPlatform,
    content,
    contentByUser,
    metric,
    latestMetric,
    report,
    reportsByUser,
  };
}
