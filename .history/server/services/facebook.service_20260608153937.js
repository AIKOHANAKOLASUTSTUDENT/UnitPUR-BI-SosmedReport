import { buildAuthorizationUrl, ensureScopes, fetchJson, normalizeScopes, normalizeExpiry } from './oauth/common.js';

const PLATFORM = 'facebook';
const META_VERSION = process.env.META_GRAPH_VERSION || 'v22.0';
const requiredScopes = ['pages_show_list', 'pages_read_engagement', 'read_insights'];

function getClientId() {
  if (!process.env.META_APP_ID) {
    throw new Error('Meta OAuth is not configured.');
  }

  return process.env.META_APP_ID;
}

function getClientSecret() {
  if (!process.env.META_APP_SECRET) {
    throw new Error('Meta OAuth is not configured.');
  }

  return process.env.META_APP_SECRET;
}

export function getRedirectUri() {
  if (!process.env.META_REDIRECT_URI) {
    throw new Error('META_REDIRECT_URI is required.');
  }

  return process.env.META_REDIRECT_URI;
}

export function buildFacebookAuthorizationUrl({ state }) {
  return buildAuthorizationUrl('https://www.facebook.com/v22.0/dialog/oauth', {
    client_id: getClientId(),
    redirect_uri: getRedirectUri(),
    state,
    scope: requiredScopes.join(','),
    response_type: 'code',
  });
}

async function introspectMetaToken(accessToken) {
  const appAccessToken = `${getClientId()}|${getClientSecret()}`;
  const tokenInfo = await fetchJson(
    `https://graph.facebook.com/${META_VERSION}/debug_token?input_token=${encodeURIComponent(accessToken)}&access_token=${encodeURIComponent(appAccessToken)}`,
  );

  const scopes = normalizeScopes(tokenInfo?.data?.scopes);
  ensureScopes({ platform: PLATFORM, grantedScopes: scopes, requiredScopes });

  if (!tokenInfo?.data?.is_valid) {
    throw new Error('Session expired. Please reconnect your account.');
  }

  return {
    scopes,
    expiresAt: tokenInfo?.data?.expires_at ? new Date(tokenInfo.data.expires_at * 1000) : null,
  };
}

export async function exchangeFacebookCodeForTokens({ code }) {
  const exchangeUrl = buildAuthorizationUrl(
    `https://graph.facebook.com/${META_VERSION}/oauth/access_token`,
    {
      client_id: getClientId(),
      client_secret: getClientSecret(),
      redirect_uri: getRedirectUri(),
      code,
    },
  );
  const exchanged = await fetchJson(exchangeUrl);
  const tokenDetails = await introspectMetaToken(exchanged.access_token);

  return {
    accessToken: exchanged.access_token,
    refreshToken: '',
    expiresAt: normalizeExpiry(exchanged.expires_in) || tokenDetails.expiresAt,
    scopes: tokenDetails.scopes,
  };
}

export async function refreshFacebookToken({ accessToken }) {
  const refreshUrl = buildAuthorizationUrl(
    `https://graph.facebook.com/${META_VERSION}/oauth/access_token`,
    {
      grant_type: 'fb_exchange_token',
      client_id: getClientId(),
      client_secret: getClientSecret(),
      fb_exchange_token: accessToken,
    },
  );
  const refreshed = await fetchJson(refreshUrl);
  const tokenDetails = await introspectMetaToken(refreshed.access_token);

  return {
    accessToken: refreshed.access_token,
    refreshToken: '',
    expiresAt: normalizeExpiry(refreshed.expires_in) || tokenDetails.expiresAt,
    scopes: tokenDetails.scopes,
  };
}

export function validateFacebookScopes(scopes) {
  return ensureScopes({ platform: PLATFORM, grantedScopes: scopes, requiredScopes });
}

export async function fetchFacebookAccountInfo(accessToken) {
  const response = await fetchJson(
    `https://graph.facebook.com/${META_VERSION}/me/accounts?fields=id,name&access_token=${encodeURIComponent(accessToken)}`,
  );

  const page = response?.data?.[0];
  if (!page?.id) {
    throw new Error('Unable to access analytics data for this account.');
  }

  return {
    accountId: page.id,
    accountName: page.name || 'Facebook Page',
    accountType: 'PAGE',
  };
}
