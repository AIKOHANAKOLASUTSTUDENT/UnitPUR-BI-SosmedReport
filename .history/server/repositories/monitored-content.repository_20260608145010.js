import { prisma } from '../db/prisma.js';

export async function upsertMonitoredContent({ socialAccountId, contentUrl, ...data }) {
  return prisma.monitoredContent.upsert({
    where: {
      socialAccountId_contentUrl: {
        socialAccountId,
        contentUrl,
      },
    },
    update: data,
    create: {
      socialAccountId,
      contentUrl,
      ...data,
    },
  });
}

export async function createMonitoredContent(data) {
  return prisma.monitoredContent.create({ data });
}

export async function findMonitoredContentById(id) {
  return prisma.monitoredContent.findUnique({
    where: { id },
    include: {
      socialAccount: true,
      engagementMetrics: { orderBy: { capturedAt: 'desc' }, take: 1 },
    },
  });
}

export async function findMonitoredContentBySocialAccountId(socialAccountId) {
  return prisma.monitoredContent.findMany({
    where: { socialAccountId },
    orderBy: { lastSyncedAt: 'desc' },
    include: {
      engagementMetrics: { orderBy: { capturedAt: 'desc' }, take: 1 },
    },
  });
}

export async function findMonitoredContentByUserId(userId) {
  return prisma.monitoredContent.findMany({
    where: { userId },
    orderBy: { lastSyncedAt: 'desc' },
    include: {
      socialAccount: true,
      engagementMetrics: { orderBy: { capturedAt: 'desc' }, take: 1 },
    },
  });
}

export async function updateMonitoredContent(id, data) {
  return prisma.monitoredContent.update({ where: { id }, data });
}

export async function deleteMonitoredContent(id) {
  return prisma.monitoredContent.delete({ where: { id } });
}

export async function deleteMonitoredContentBySocialAccountId(socialAccountId) {
  return prisma.monitoredContent.deleteMany({ where: { socialAccountId } });
}
