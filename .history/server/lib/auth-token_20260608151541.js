import jwt from "jsonwebtoken";

const TOKEN_EXPIRY = process.env.JWT_EXPIRES_IN || "7d";
const JWT_SECRET = process.env.JWT_SECRET;

function getSecret() {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is required for authentication.");
  }

  return JWT_SECRET;
}

export function signAuthToken(payload) {
  return jwt.sign(payload, getSecret(), {
    expiresIn: TOKEN_EXPIRY,
    issuer: "social-media-engagement-dashboard",
    audience: "social-media-engagement-dashboard-users",
  });
}

export function verifyAuthToken(token) {
  return jwt.verify(token, getSecret(), {
    issuer: "social-media-engagement-dashboard",
    audience: "social-media-engagement-dashboard-users",
  });
}

export function extractAuthToken(req) {
  const header = req.headers.authorization || "";
  if (header.startsWith("Bearer ")) {
    return header.slice(7).trim();
  }

  return req.cookies?.auth_token || "";
}

export function authCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 1000 * 60 * 60 * 24 * 7,
  };
}
