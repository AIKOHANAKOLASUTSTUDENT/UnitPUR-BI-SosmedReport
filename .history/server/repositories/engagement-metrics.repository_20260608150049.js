import { prisma } from "../db/prisma.js";

export async function createEngagementMetric(data) {
  return prisma.engagementMetric.create({ data });
}

export async function createEngagementMetricsBatch(data) {
  return prisma.engagementMetric.createMany({ data });
}

export async function findEngagementMetricById(id) {
  return prisma.engagementMetric.findUnique({ where: { id } });
}

export async function findEngagementMetricsByContentId(monitoredContentId) {
  return prisma.engagementMetric.findMany({
    where: { monitoredContentId },
    orderBy: { capturedAt: "desc" },
  });
}

export async function findLatestEngagementMetricByContentId(
  monitoredContentId,
) {
  return prisma.engagementMetric.findFirst({
    where: { monitoredContentId },
    orderBy: { capturedAt: "desc" },
  });
}

export async function updateEngagementMetric(id, data) {
  return prisma.engagementMetric.update({ where: { id }, data });
}

export async function deleteEngagementMetric(id) {
  return prisma.engagementMetric.delete({ where: { id } });
}

export async function deleteEngagementMetricsByContentId(monitoredContentId) {
  return prisma.engagementMetric.deleteMany({ where: { monitoredContentId } });
}
