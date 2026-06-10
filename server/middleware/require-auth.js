import { extractAuthToken, verifyAuthToken } from "../lib/auth-token.js";
import { findUserById } from "../repositories/users.repository.js";

export async function requireAuth(req, res, next) {
  try {
    const token = extractAuthToken(req);
    if (!token) {
      return res.status(401).json({ error: "Authentication required." });
    }

    const payload = verifyAuthToken(token);
    const user = await findUserById(payload.sub);
    if (!user) {
      return res.status(401).json({ error: "Authentication required." });
    }

    req.auth = {
      userId: user.id,
      email: user.email,
      displayName: user.displayName || "",
    };

    return next();
  } catch {
    return res.status(401).json({ error: "Authentication required." });
  }
}
