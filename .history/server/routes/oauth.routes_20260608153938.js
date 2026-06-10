import express from 'express';
import { randomUUID } from 'node:crypto';
import { authCookieOptions } from '../lib/auth-token.js';
import { encryptToken, decryptToken } from '../lib/crypto.js';
import { requireAuth } from '../middleware/require-auth.js';
import { socialAccountsRepository } from '../repositories/index.js';
import {
  buildInstagramAuthorizationUrl,
  exchangeInstagramCodeForTokens,
  fetchInstagramAccountInfo,
  getRedirectUri as getInstagramRedirectUri,
  refreshInstagramToken,
  validateInstagramScopes,
} from '../services/instagram.service.js';
import {
  buildFacebookAuthorizationUrl,
  exchangeFacebookCodeForTokens,
  fetchFacebookAccountInfo,
  getRedirectUri as getFacebookRedirectUri,
  refreshFacebookToken,
  validateFacebookScopes,
} from '../services/facebook.service.js';
import {
  buildYouTubeAuthorizationUrl,
  exchangeYouTubeCodeForTokens,
  fetchYouTubeAccountInfo,
  getRedirectUri as getYouTubeRedirectUri,
  refreshYouTubeToken,
  validateYouTubeScopes,
} from '../services/youtube.service.js';
import {
  buildTikTokAuthorizationUrl,
  exchangeTikTokCodeForTokens,
  fetchTikTokAccountInfo,
  getRedirectUri as getTikTokRedirectUri,
  refreshTikTokToken,
  validateTikTokScopes,
} from '../services/tiktok.service.js';

const router = express.Router();
const oauthStates = new Map();
const STATE_TTL_MS = 10 * 60 * 1000;

function makePopupResponse(res, payload) {
  const message = JSON.stringify(payload.message);
  res.type('html').send(`<!doctype html>
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

function registerState(userId, platform) {
  const state = randomUUID();
  oauthStates.set(state, {
    userId,
    platform,
    createdAt: Date.now(),
  });
  return state;
}

function consumeState(state, platform) {
  const stateRecord = oauthStates.get(state);
  if (!stateRecord) {
    return null;
  }

  oauthStates.delete(state);

  if (stateRecord.platform !== platform) {
    return null;
  }

  if (Date.now() - stateRecord.createdAt > STATE_TTL_MS) {
    return null;
  }

  return stateRecord;
}

async function persistSocialAccount(userId, platform, accountInfo, tokenResult) {
  const encryptedAccessToken = encryptToken(tokenResult.accessToken);
  const encryptedRefreshToken = tokenResult.refreshToken
    ? encryptToken(tokenResult.refreshToken)
    : null;

  const existing = await socialAccountsRepository.findSocialAccountByPlatform(userId, platform);
  const payload = {
    userId,
    platform,
    accountId: accountInfo.accountId,
    accountName: accountInfo.accountName,
    accountType: accountInfo.accountType,
    accessToken: encryptedAccessToken,
    refreshToken: encryptedRefreshToken,
    expiresAt: tokenResult.expiresAt ? new Date(tokenResult.expiresAt) : null,
  };

  if (existing) {
    return socialAccountsRepository.updateSocialAccount(existing.id, payload);
  }

  return socialAccountsRepository.createSocialAccount(payload);
}

function readPlatformConnection(userId, platform) {
  return socialAccountsRepository.findSocialAccountByPlatform(userId, platform);
}

async function handleStart(req, res, platform, buildUrl) {
  const state = registerState(req.auth.userId, platform);
  const authorizationUrl = buildUrl({ state });
  return res.redirect(authorizationUrl);
}

async function handleCallback(req, res, platform, exchangeFn, fetchAccountFn, validateScopesFn) {
  const state = String(req.query.state || '');
  const code = String(req.query.code || '');
  const oauthError = String(req.query.error || '');

  const stateRecord = consumeState(state, platform);
  if (!stateRecord) {
    return makePopupResponse(res, {
      title: 'Login failed',
      description: 'Login failed. Please check your account permissions and try again.',
      message: { type: 'oauth-failed', platform, error: 'Invalid OAuth state.' },
    });
  }

  if (oauthError) {
    return makePopupResponse(res, {
      title: 'Login failed',
      description: 'Login failed. Please check your account permissions and try again.',
      message: { type: 'oauth-failed', platform, error: oauthError },
    });
  }

  try {
    const tokenResult = await exchangeFn({ code });
    validateScopesFn(tokenResult.scopes);
    const accountInfo = await fetchAccountFn(tokenResult.accessToken);
    await persistSocialAccount(stateRecord.userId, platform, accountInfo, tokenResult);

    return makePopupResponse(res, {
      title: 'Login successful',
      description: `${accountInfo.accountName} is now connected.`,
      message: { type: 'oauth-success', platform },
    });
  } catch (error) {
    return makePopupResponse(res, {
      title: 'Login failed',
      description: 'Login failed. Please check your account permissions and try again.',
      message: {
        type: 'oauth-failed',
        platform,
        error: error instanceof Error ? error.message : 'Authentication failed.',
      },
    });
  }
}

async function handleRefresh(req, res, platform, refreshFn, validateScopesFn) {
  const existing = await readPlatformConnection(req.auth.userId, platform);
  if (!existing) {
    return res.status(404).json({ error: 'No connected account found.' });
  }

  const refreshed = await refreshFn({
    accessToken: decryptToken(existing.accessToken),
    refreshToken: decryptToken(existing.refreshToken),
  });
  validateScopesFn(refreshed.scopes);

  const updated = await socialAccountsRepository.updateSocialAccount(existing.id, {
    accessToken: encryptToken(refreshed.accessToken),
    refreshToken: refreshed.refreshToken ? encryptToken(refreshed.refreshToken) : null,
    expiresAt: refreshed.expiresAt ? new Date(refreshed.expiresAt) : null,
  });

  return res.json({
    ok: true,
    account: {
      id: updated.id,
      accountId: updated.accountId,
      accountName: updated.accountName,
      connectedAt: updated.connectedAt,
      updatedAt: updated.updatedAt,
    },
  });
}

router.get('/instagram', requireAuth, async (req, res) => {
  return handleStart(req, res, 'INSTAGRAM', buildInstagramAuthorizationUrl);
});

router.get('/instagram/callback', async (req, res) => {
  return handleCallback(req, res, 'INSTAGRAM', exchangeInstagramCodeForTokens, fetchInstagramAccountInfo, validateInstagramScopes);
});

router.post('/instagram/refresh', requireAuth, async (req, res) => {
  return handleRefresh(req, res, 'INSTAGRAM', refreshInstagramToken, validateInstagramScopes);
});

router.get('/facebook', requireAuth, async (req, res) => {
  return handleStart(req, res, 'FACEBOOK', buildFacebookAuthorizationUrl);
});

router.get('/facebook/callback', async (req, res) => {
  return handleCallback(req, res, 'FACEBOOK', exchangeFacebookCodeForTokens, fetchFacebookAccountInfo, validateFacebookScopes);
});

router.post('/facebook/refresh', requireAuth, async (req, res) => {
  return handleRefresh(req, res, 'FACEBOOK', refreshFacebookToken, validateFacebookScopes);
});

router.get('/youtube', requireAuth, async (req, res) => {
  return handleStart(req, res, 'YOUTUBE', buildYouTubeAuthorizationUrl);
});

router.get('/youtube/callback', async (req, res) => {
  return handleCallback(req, res, 'YOUTUBE', exchangeYouTubeCodeForTokens, fetchYouTubeAccountInfo, validateYouTubeScopes);
});

router.post('/youtube/refresh', requireAuth, async (req, res) => {
  return handleRefresh(req, res, 'YOUTUBE', refreshYouTubeToken, validateYouTubeScopes);
});

router.get('/tiktok', requireAuth, async (req, res) => {
  return handleStart(req, res, 'TIKTOK', buildTikTokAuthorizationUrl);
});

router.get('/tiktok/callback', async (req, res) => {
  return handleCallback(req, res, 'TIKTOK', exchangeTikTokCodeForTokens, fetchTikTokAccountInfo, validateTikTokScopes);
});

router.post('/tiktok/refresh', requireAuth, async (req, res) => {
  return handleRefresh(req, res, 'TIKTOK', refreshTikTokToken, validateTikTokScopes);
});

export default router;
