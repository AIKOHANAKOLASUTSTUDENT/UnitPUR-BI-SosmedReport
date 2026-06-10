import {
  createUser,
  findUserByEmail,
} from "../repositories/users.repository.js";
import { hashPassword, comparePassword } from "../lib/password.js";
import { signAuthToken } from "../lib/auth-token.js";

function toPublicUser(user) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName || "",
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function registerUser({ email, password, displayName }) {
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    throw new Error("An account with this email already exists.");
  }

  const passwordHash = await hashPassword(password);
  const user = await createUser({
    email,
    passwordHash,
    displayName: displayName || null,
  });

  const token = signAuthToken({ sub: user.id, email: user.email });

  return {
    user: toPublicUser(user),
    token,
  };
}

export async function loginUser({ email, password }) {
  const user = await findUserByEmail(email);
  if (!user || !user.passwordHash) {
    throw new Error("Invalid email or password.");
  }

  const isValid = await comparePassword(password, user.passwordHash);
  if (!isValid) {
    throw new Error("Invalid email or password.");
  }

  const token = signAuthToken({ sub: user.id, email: user.email });

  return {
    user: toPublicUser(user),
    token,
  };
}
