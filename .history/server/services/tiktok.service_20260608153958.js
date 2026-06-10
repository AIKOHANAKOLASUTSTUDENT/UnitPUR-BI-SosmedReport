import {
  buildAuthorizationUrl,
  ensureScopes,
  fetchJson,
  normalizeScopes,
  normalizeExpiry,
} from "./oauth/common.js";

const PLATFORM = "tiktok";
const requiredScopes = ["user.info.basic", "video.list"];

function getClientId() {
  if (!process.env.TIKTOK_CLIENT_ID) {
    throw new Error("TikTok OAuth is not configured.");
  }

  return process.env.TIKTOK_CLIENT_ID;
}

function getClientSecret() {
  if (!process.env.TIKTOK_CLIENT_SECRET) {
    throw new Error("TikTok OAuth is not configured.");
  }

  return process.env.TIKTOK_CLIENT_SECRET;
}

export function getRedirectUri() {
  if (!process.env.TIKTOK_REDIRECT_URI) {
    throw new Error("TIKTOK_REDIRECT_URI is required.");
  }

  return process.env.TIKTOK_REDIRECT_URI;
}

export function buildTikTokAuthorizationUrl({ state }) {
  return buildAuthorizationUrl("https://www.tiktok.com/v2/auth/authorize/", {
    client_key: getClientId(),
    redirect_uri: getRedirectUri(),
    response_type: "code",
    scope: requiredScopes.join(","),
    state,
  });
}

export async function exchangeTikTokCodeForTokens({ code }) {
  const tokenResponse = await fetchJson(
    "https://open.tiktokapis.com/v2/oauth/token/",
    {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_key: getClientId(),
        client_secret: getClientSecret(),
        code,
        grant_type: "authorization_code",
        redirect_uri: getRedirectUri(),
      }),
    },
  );

  const scopes = normalizeScopes(tokenResponse.scope);
  ensureScopes({ platform: PLATFORM, grantedScopes: scopes, requiredScopes });

  return {
    accessToken: tokenResponse.access_token,
    refreshToken: tokenResponse.refresh_token || "",
    expiresAt: normalizeExpiry(tokenResponse.expires_in),
    scopes,
  };
}

export async function refreshTikTokToken({ refreshToken }) {
  if (!refreshToken) {
    throw new Error("Session expired. Please reconnect your account.");
  }

  const tokenResponse = await fetchJson(
    "https://open.tiktokapis.com/v2/oauth/token/",
    {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_key: getClientId(),
        client_secret: getClientSecret(),
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    },
  );

  const scopes = normalizeScopes(tokenResponse.scope) || requiredScopes;
  ensureScopes({ platform: PLATFORM, grantedScopes: scopes, requiredScopes });

  return {
    accessToken: tokenResponse.access_token,
    refreshToken: tokenResponse.refresh_token || refreshToken,
    expiresAt: normalizeExpiry(tokenResponse.expires_in),
    scopes,
  };
}

export function validateTikTokScopes(scopes) {
  return ensureScopes({
    platform: PLATFORM,
    grantedScopes: scopes,
    requiredScopes,
  });
}

export async function fetchTikTokAccountInfo(accessToken) {
  const response = await fetchJson(
    "https://open.tiktokapis.com/v2/user/info/",
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        fields: ["open_id", "union_id", "display_name", "avatar_url"],
      }),
    },
  );

  const user = response?.data?.user || response?.data?.users?.[0] || {};
  if (!user.open_id && !user.union_id) {
    throw new Error("Unable to access analytics data for this account.");
  }

  return {
    accountId: user.open_id || user.union_id,
    accountName: user.display_name || "TikTok account",
    accountType: "CREATOR",
  };
}
