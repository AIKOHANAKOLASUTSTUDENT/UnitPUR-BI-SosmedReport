import { prisma } from '../db/prisma.js';

export async function createReportExport(data) {
  return prisma.reportExport.create({ data });
}

export async function findReportExportById(id) {
  return prisma.reportExport.findUnique({ where: { id } });
}

export async function findReportExportsByUserId(userId) {
  return prisma.reportExport.findMany({
    where: { userId },
    orderBy: { exportedAt: 'desc' },
  });
}

export async function updateReportExport(id, data) {
  return prisma.reportExport.update({ where: { id }, data });
}

export async function deleteReportExport(id) {
  return prisma.reportExport.delete({ where: { id } });
}
