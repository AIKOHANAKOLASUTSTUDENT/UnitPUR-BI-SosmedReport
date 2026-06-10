import { prisma } from '../db/prisma.js';

export async function upsertSocialAccount({ userId, platform, accountId, ...data }) {
  return prisma.socialAccount.upsert({
    where: {
      userId_platform_accountId: {
        userId,
        platform,
        accountId,
      },
    },
    update: data,
    create: {
      userId,
      platform,
      accountId,
      ...data,
    },
  });
}

export async function createSocialAccount(data) {
  return prisma.socialAccount.create({ data });
}

export async function findSocialAccountById(id) {
  return prisma.socialAccount.findUnique({ where: { id } });
}

export async function findSocialAccountsByUserId(userId) {
  return prisma.socialAccount.findMany({
    where: { userId },
    orderBy: { connectedAt: 'desc' },
  });
}

export async function findSocialAccountByPlatform(userId, platform) {
  return prisma.socialAccount.findFirst({
    where: { userId, platform },
    orderBy: { connectedAt: 'desc' },
  });
}

export async function updateSocialAccount(id, data) {
  return prisma.socialAccount.update({ where: { id }, data });
}

export async function deleteSocialAccount(id) {
  return prisma.socialAccount.delete({ where: { id } });
}
