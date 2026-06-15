import express from "express";
import { requireAuth } from "../middleware/require-auth.js";
import {
  buildInstagramAuthorizationUrl,
  exchangeInstagramCodeForTokens,
  validateInstagramScopes,
  fetchInstagramAccountInfo,
  fetchInstagramProfile,
} from "../services/instagram.service.js";

import { socialAccountsRepository } from "../repositories/index.js";
import { decryptToken, encryptToken } from "../lib/crypto.js";
import { randomUUID } from "node:crypto";

const router = express.Router();

// Simple in-memory state store for this dedicated phase-1 router
// (mirrors logic in server/routes/oauth.routes.js)
const oauthStates = new Map();
const STATE_TTL_MS = 10 * 60 * 1000;

function makePopupResponse(res, payload) {
  const message = JSON.stringify(payload.message);
  res.type("html").send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>OAuth Result</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 0; min-height: 100vh; display: grid; place-items: center; background: #0f172a; color: #e2e8f0; }
      main { max-width: 460px; padding: 32px; text-align: center; }
      h1 { margin: 0 0 12px; font-size: 24px; }
      p { margin: 0; color: #94a3b8; line-height: 1.5; }
    </style>
  </head>
  <body>
    <main>
      <h1>${payload.title}</h1>
      <p>${payload.description}</p>
    </main>
    <script>
      (function () {
        try {
          if (window.opener) {
            window.opener.postMessage(${message}, '*');
          }
        } catch (error) {
          console.error(error);
        }
        window.setTimeout(() => window.close(), 250);
      }());
    </script>
  </body>
</html>`);
}

function registerState(userId) {
  const state = randomUUID();
  oauthStates.set(state, {
    userId,
    createdAt: Date.now(),
  });
  return state;
}

function consumeState(state) {
  const stateRecord = oauthStates.get(state);
  if (!stateRecord) return null;

  oauthStates.delete(state);

  if (Date.now() - stateRecord.createdAt > STATE_TTL_MS) return null;
  return stateRecord;
}

router.get("/connect", requireAuth, async (req, res) => {
  const state = registerState(req.auth.userId);

  // Redirect to Meta OAuth.
  // We rely on META_REDIRECT_URI being set to /api/instagram/callback
  const authorizationUrl = buildInstagramAuthorizationUrl({ state });
  return res.redirect(authorizationUrl);
});

router.post("/disconnect", requireAuth, async (req, res) => {
  try {
    const account = await socialAccountsRepository.findSocialAccountByPlatform(
      req.auth.userId,
      "INSTAGRAM",
    );

    if (!account) {
      return res.status(404).json({ error: "No connected Instagram account." });
    }

    await socialAccountsRepository.deleteSocialAccount(account.id);

    return res.json({ ok: true });
  } catch (error) {
    return res.status(400).json({
      error:
        error instanceof Error
          ? error.message
          : "Failed to disconnect Instagram account.",
    });
  }
});

router.get("/callback", async (req, res) => {
  const state = String(req.query.state || "");
  const code = String(req.query.code || "");
  const oauthError = String(req.query.error || "");

  const stateRecord = consumeState(state);
  if (!stateRecord) {
    return makePopupResponse(res, {
      title: "Login failed",
      description:
        "Login failed. Please check your account permissions and try again.",
      message: {
        type: "oauth-failed",
        error: "Invalid OAuth state.",
      },
    });
  }

  if (oauthError) {
    return makePopupResponse(res, {
      title: "Login failed",
      description:
        "Login failed. Please check your account permissions and try again.",
      message: { type: "oauth-failed", error: oauthError },
    });
  }

  try {
    const tokenResult = await exchangeInstagramCodeForTokens({ code });
    validateInstagramScopes(tokenResult.scopes);

    // We use the existing stored account info coming from `me/accounts`
    // in the current service (exchangeInstagramCodeForTokens only gives token).
    // For phase-1, persist based on minimal info fetch.
    // NOTE: This router persists SocialAccount using existing service's
    // fetchInstagramAccountInfo.
    // To avoid circular dependency, we reuse fetchInstagramProfile's token call
    // and also store instagram_business_account info.

    // Fetch business/creator account basic info to save accountId/accountName
    // via the already-existing fetchInstagramAccountInfo in instagram.service.
    const { fetchInstagramAccountInfo } =
      await import("../services/instagram.service.js");
    const accountInfo = await fetchInstagramAccountInfo(
      tokenResult.accessToken,
    );

    // persist
    const encryptedAccessToken = encryptToken(tokenResult.accessToken);
    const payload = {
      userId: stateRecord.userId,
      platform: "INSTAGRAM",
      accountId: accountInfo.accountId,
      accountName: accountInfo.accountName,
      accountType: accountInfo.accountType,
      accessToken: encryptedAccessToken,
      refreshToken: null,
      expiresAt: tokenResult.expiresAt ? new Date(tokenResult.expiresAt) : null,
    };

    const existing = await socialAccountsRepository.findSocialAccountByPlatform(
      stateRecord.userId,
      "INSTAGRAM",
    );

    if (existing) {
      await socialAccountsRepository.updateSocialAccount(existing.id, payload);
    } else {
      await socialAccountsRepository.createSocialAccount(payload);
    }

    return makePopupResponse(res, {
      title: "Login successful",
      description: `${accountInfo.accountName} is now connected.`,
      message: { type: "oauth-success", platform: "instagram" },
    });
  } catch (error) {
    return makePopupResponse(res, {
      title: "Login failed",
      description:
        "Login failed. Please check your account permissions and try again.",
      message: {
        type: "oauth-failed",
        error:
          error instanceof Error ? error.message : "Authentication failed.",
      },
    });
  }
});

router.get("/profile", requireAuth, async (req, res) => {
  try {
    const account = await socialAccountsRepository.findSocialAccountByPlatform(
      req.auth.userId,
      "INSTAGRAM",
    );

    if (!account) {
      return res.status(404).json({ error: "No connected Instagram account." });
    }

    const accessToken = decryptToken(account.accessToken);
    const profile = await fetchInstagramProfile(accessToken);

    return res.json({
      ok: true,
      account: {
        instagramUserId: profile.instagramUserId,
        username: profile.username,
        profilePictureUrl: profile.profilePictureUrl,
        followersCount: profile.followersCount,
        followingCount: profile.followingCount,
        mediaCount: profile.mediaCount,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to fetch Instagram profile.";

    // Normalize a few expected errors.
    const normalized = message.toLowerCase();
    if (
      normalized.includes("session expired") ||
      normalized.includes("token")
    ) {
      return res.status(401).json({
        error: "Session expired. Please reconnect your account.",
        code: "SESSION_EXPIRED",
      });
    }

    return res.status(400).json({ error: message });
  }
});

export default router;
