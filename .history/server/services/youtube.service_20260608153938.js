import { buildAuthorizationUrl, ensureScopes, fetchJson, normalizeScopes, normalizeExpiry } from './oauth/common.js';

const PLATFORM = 'youtube';
const requiredScopes = [
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/yt-analytics.readonly',
];

function getClientId() {
  if (!process.env.GOOGLE_CLIENT_ID) {
    throw new Error('Google OAuth is not configured.');
  }

  return process.env.GOOGLE_CLIENT_ID;
}

function getClientSecret() {
  if (!process.env.GOOGLE_CLIENT_SECRET) {
    throw new Error('Google OAuth is not configured.');
  }

  return process.env.GOOGLE_CLIENT_SECRET;
}

export function getRedirectUri() {
  if (!process.env.GOOGLE_REDIRECT_URI) {
    throw new Error('GOOGLE_REDIRECT_URI is required.');
  }

  return process.env.GOOGLE_REDIRECT_URI;
}

export function buildYouTubeAuthorizationUrl({ state }) {
  return buildAuthorizationUrl('https://accounts.google.com/o/oauth2/v2/auth', {
    client_id: getClientId(),
    redirect_uri: getRedirectUri(),
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    state,
    scope: requiredScopes.join(' '),
  });
}

export async function exchangeYouTubeCodeForTokens({ code }) {
  const tokenResponse = await fetchJson('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: getClientId(),
      client_secret: getClientSecret(),
      code,
      grant_type: 'authorization_code',
      redirect_uri: getRedirectUri(),
    }),
  });

  const scopes = normalizeScopes(tokenResponse.scope);
  ensureScopes({ platform: PLATFORM, grantedScopes: scopes, requiredScopes });

  return {
    accessToken: tokenResponse.access_token,
    refreshToken: tokenResponse.refresh_token || '',
    expiresAt: normalizeExpiry(tokenResponse.expires_in),
    scopes,
  };
}

export async function refreshYouTubeToken({ refreshToken }) {
  if (!refreshToken) {
    throw new Error('Session expired. Please reconnect your account.');
  }

  const tokenResponse = await fetchJson('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: getClientId(),
      client_secret: getClientSecret(),
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  const scopes = normalizeScopes(tokenResponse.scope) || requiredScopes;
  ensureScopes({ platform: PLATFORM, grantedScopes: scopes, requiredScopes });

  return {
    accessToken: tokenResponse.access_token,
    refreshToken,
    expiresAt: normalizeExpiry(tokenResponse.expires_in),
    scopes,
  };
}

export function validateYouTubeScopes(scopes) {
  return ensureScopes({ platform: PLATFORM, grantedScopes: scopes, requiredScopes });
}

export async function fetchYouTubeAccountInfo(accessToken) {
  const response = await fetchJson(
    `https://www.googleapis.com/youtube/v3/channels?part=id,snippet&mine=true&access_token=${encodeURIComponent(accessToken)}`,
  );

  const channel = response?.items?.[0];
  if (!channel?.id) {
    throw new Error('Unable to access analytics data for this account.');
  }

  return {
    accountId: channel.id,
    accountName: channel.snippet?.title || 'YouTube channel',
    accountType: 'CHANNEL',
  };
}
