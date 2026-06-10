import { prisma } from "../db/prisma.js";

export async function createUser(data) {
  return prisma.user.create({ data });
}

export async function findUserById(id) {
  return prisma.user.findUnique({ where: { id } });
}

export async function findUserByEmail(email) {
  return prisma.user.findUnique({ where: { email } });
}

export async function listUsers() {
  return prisma.user.findMany({ orderBy: { createdAt: "asc" } });
}

export async function updateUser(id, data) {
  return prisma.user.update({ where: { id }, data });
}

export async function deleteUser(id) {
  return prisma.user.delete({ where: { id } });
}
