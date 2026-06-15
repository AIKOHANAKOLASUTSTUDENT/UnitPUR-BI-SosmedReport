import {
  buildAuthorizationUrl,
  ensureScopes,
  fetchJson,
  normalizeScopes,
  normalizeExpiry,
} from "./oauth/common.js";

const PLATFORM = "instagram";
const META_VERSION = process.env.META_GRAPH_VERSION || "v22.0";
const requiredScopes = [
  "instagram_basic",
  "instagram_manage_insights",
  "pages_show_list",
  "pages_read_engagement",
];

function getClientId() {
  if (!process.env.META_APP_ID) {
    throw new Error("Meta OAuth is not configured.");
  }

  return process.env.META_APP_ID;
}

function getClientSecret() {
  if (!process.env.META_APP_SECRET) {
    throw new Error("Meta OAuth is not configured.");
  }

  return process.env.META_APP_SECRET;
}

export function getRedirectUri() {
  if (!process.env.META_REDIRECT_URI) {
    throw new Error("META_REDIRECT_URI is required.");
  }

  return process.env.META_REDIRECT_URI;
}

export function buildInstagramAuthorizationUrl({ state }) {
  return buildAuthorizationUrl("https://www.facebook.com/v22.0/dialog/oauth", {
    client_id: getClientId(),
    redirect_uri: getRedirectUri(),
    state,
    scope: requiredScopes.join(","),
    response_type: "code",
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
    throw new Error("Session expired. Please reconnect your account.");
  }

  return {
    scopes,
    expiresAt: tokenInfo?.data?.expires_at
      ? new Date(tokenInfo.data.expires_at * 1000)
      : null,
  };
}

export async function exchangeInstagramCodeForTokens({ code }) {
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
    refreshToken: "",
    expiresAt: normalizeExpiry(exchanged.expires_in) || tokenDetails.expiresAt,
    scopes: tokenDetails.scopes,
  };
}

export async function refreshInstagramToken({ accessToken }) {
  const refreshUrl = buildAuthorizationUrl(
    `https://graph.facebook.com/${META_VERSION}/oauth/access_token`,
    {
      grant_type: "fb_exchange_token",
      client_id: getClientId(),
      client_secret: getClientSecret(),
      fb_exchange_token: accessToken,
    },
  );
  const refreshed = await fetchJson(refreshUrl);
  const tokenDetails = await introspectMetaToken(refreshed.access_token);

  return {
    accessToken: refreshed.access_token,
    refreshToken: "",
    expiresAt: normalizeExpiry(refreshed.expires_in) || tokenDetails.expiresAt,
    scopes: tokenDetails.scopes,
  };
}

export function validateInstagramScopes(scopes) {
  return ensureScopes({
    platform: PLATFORM,
    grantedScopes: scopes,
    requiredScopes,
  });
}

export async function fetchInstagramAccountInfo(accessToken) {
  const response = await fetchJson(
    `https://graph.facebook.com/${META_VERSION}/me/accounts?fields=id,name,instagram_business_account{id,username}&access_token=${encodeURIComponent(accessToken)}`,
  );

  const page = response?.data?.find(
    (entry) => entry.instagram_business_account,
  );
  const instagramAccount = page?.instagram_business_account;
  if (!instagramAccount?.id) {
    throw new Error(
      "Akun ini bukan Business/Creator atau tidak memiliki akses Instagram Business.",
    );
  }

  return {
    accountId: instagramAccount.id,
    accountName: instagramAccount.username || page?.name || "Instagram account",
    accountType: "BUSINESS",
  };
}

function normalizeInstagramMetricNumber(value) {
  const n = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(n) ? n : 0;
}

export async function fetchInstagramProfile(accessToken) {
  // For Graph API: instagram user / business account supports these fields.
  // Using the authenticated Instagram user endpoint: /me
  const response = await fetchJson(
    `https://graph.facebook.com/${META_VERSION}/me?fields=id,username,profile_picture_url,followers_count,follows_count,media_count&access_token=${encodeURIComponent(accessToken)}`,
  );

  const instagramUserId = response?.id;
  const username = response?.username;
  const profilePictureUrl = response?.profile_picture_url;

  if (!instagramUserId || !username) {
    throw new Error(
      "Unable to access Instagram profile. Pastikan akun Business/Creator Anda sudah disetujui dan permission diberikan.",
    );
  }

  return {
    instagramUserId,
    username,
    profilePictureUrl: profilePictureUrl || null,
    followersCount: normalizeInstagramMetricNumber(response?.followers_count),
    followingCount: normalizeInstagramMetricNumber(response?.follows_count),
    mediaCount: normalizeInstagramMetricNumber(response?.media_count),
  };
}
