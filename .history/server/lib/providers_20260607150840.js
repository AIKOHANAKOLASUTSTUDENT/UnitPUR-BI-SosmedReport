import { z } from "zod";

const META_VERSION = process.env.META_GRAPH_VERSION || "v22.0";

const providerConfig = {
  instagram: {
    authUrl: "https://www.facebook.com",
    scopes: [
      "instagram_basic",
      "instagram_manage_insights",
      "pages_show_list",
      "pages_read_engagement",
    ],
  },
  facebook: {
    authUrl: "https://www.facebook.com",
    scopes: ["pages_show_list", "pages_read_engagement", "read_insights"],
  },
  youtube: {
    authUrl: "https://accounts.google.com",
    scopes: [
      "https://www.googleapis.com/auth/youtube.readonly",
      "https://www.googleapis.com/auth/yt-analytics.readonly",
    ],
  },
  tiktok: {
    authUrl: "https://www.tiktok.com",
    scopes: ["user.info.basic", "video.list"],
  },
};

function fetchJson(url, options = {}) {
  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      accept: "application/json",
    },
  }).then(async (response) => {
    const text = await response.text();
    const body = text ? JSON.parse(text) : {};
    if (!response.ok) {
      const message =
        body?.error?.message ||
        body?.message ||
        `Request failed with status ${response.status}`;
      const error = new Error(message);
      error.status = response.status;
      error.body = body;
      throw error;
    }
    return body;
  });
}

function buildMetaAuthUrl(platform, state, callbackUrl) {
  const cfg = providerConfig[platform];
  const clientId = process.env.META_APP_ID;
  if (!clientId) {
    throw new Error("Meta app credentials are not configured.");
  }

  const scopes = cfg.scopes.join(",");
  const url = new URL(`${cfg.authUrl}/v22.0/dialog/oauth`);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", callbackUrl);
  url.searchParams.set("state", state);
  url.searchParams.set("scope", scopes);
  url.searchParams.set("response_type", "code");
  return url.toString();
}

function buildGoogleAuthUrl(state, callbackUrl) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error("Google OAuth credentials are not configured.");
  }

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", callbackUrl);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("include_granted_scopes", "true");
  url.searchParams.set("state", state);
  url.searchParams.set("scope", providerConfig.youtube.scopes.join(" "));
  return url.toString();
}

function buildTikTokAuthUrl(state, callbackUrl) {
  const clientId = process.env.TIKTOK_CLIENT_KEY;
  if (!clientId) {
    throw new Error("TikTok app credentials are not configured.");
  }

  const url = new URL("https://www.tiktok.com/v2/auth/authorize/");
  url.searchParams.set("client_key", clientId);
  url.searchParams.set("redirect_uri", callbackUrl);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", providerConfig.tiktok.scopes.join(","));
  url.searchParams.set("state", state);
  return url.toString();
}

export function getPlatformConfig(platform) {
  const config = providerConfig[platform];
  if (!config) {
    throw new Error("Unsupported platform.");
  }

  return {
    platform,
    scopes: config.scopes,
  };
}

export function buildAuthorizationUrl(platform, { state, callbackUrl }) {
  if (platform === "instagram" || platform === "facebook") {
    return buildMetaAuthUrl(platform, state, callbackUrl);
  }

  if (platform === "youtube") {
    return buildGoogleAuthUrl(state, callbackUrl);
  }

  return buildTikTokAuthUrl(state, callbackUrl);
}

async function exchangeMetaCode(platform, code, callbackUrl) {
  const clientId = process.env.META_APP_ID;
  const clientSecret = process.env.META_APP_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Meta app credentials are not configured.");
  }

  const tokenUrl = new URL(
    `https://graph.facebook.com/${META_VERSION}/oauth/access_token`,
  );
  tokenUrl.searchParams.set("client_id", clientId);
  tokenUrl.searchParams.set("client_secret", clientSecret);
  tokenUrl.searchParams.set("redirect_uri", callbackUrl);
  tokenUrl.searchParams.set("code", code);

  const tokenResponse = await fetchJson(tokenUrl.toString());
  const scopes = tokenResponse.granted_scopes
    ? String(tokenResponse.granted_scopes)
        .split(",")
        .map((scope) => scope.trim())
        .filter(Boolean)
    : providerConfig[platform].scopes;

  return {
    accessToken: tokenResponse.access_token,
    refreshToken: "",
    expiresAt: tokenResponse.expires_in
      ? new Date(
          Date.now() + Number(tokenResponse.expires_in) * 1000,
        ).toISOString()
      : null,
    scopes,
  };
}

async function exchangeGoogleCode(code, callbackUrl) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth credentials are not configured.");
  }

  const tokenResponse = await fetchJson("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: callbackUrl,
    }),
  });

  return {
    accessToken: tokenResponse.access_token,
    refreshToken: tokenResponse.refresh_token || "",
    expiresAt: tokenResponse.expires_in
      ? new Date(
          Date.now() + Number(tokenResponse.expires_in) * 1000,
        ).toISOString()
      : null,
    scopes: tokenResponse.scope
      ? String(tokenResponse.scope)
          .split(" ")
          .map((scope) => scope.trim())
          .filter(Boolean)
      : providerConfig.youtube.scopes,
  };
}

async function exchangeTikTokCode(code, callbackUrl) {
  const clientId = process.env.TIKTOK_CLIENT_KEY;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("TikTok app credentials are not configured.");
  }

  const tokenResponse = await fetchJson(
    "https://open.tiktokapis.com/v2/oauth/token/",
    {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_key: clientId,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: callbackUrl,
      }),
    },
  );

  return {
    accessToken: tokenResponse.access_token,
    refreshToken: tokenResponse.refresh_token || "",
    expiresAt: tokenResponse.expires_in
      ? new Date(
          Date.now() + Number(tokenResponse.expires_in) * 1000,
        ).toISOString()
      : null,
    scopes: tokenResponse.scope
      ? String(tokenResponse.scope)
          .split(",")
          .map((scope) => scope.trim())
          .filter(Boolean)
      : providerConfig.tiktok.scopes,
  };
}

export async function exchangeAuthorizationCode(platform, code, callbackUrl) {
  if (!code) {
    throw new Error("Authorization code was not returned by the provider.");
  }

  if (platform === "instagram" || platform === "facebook") {
    return exchangeMetaCode(platform, code, callbackUrl);
  }

  if (platform === "youtube") {
    return exchangeGoogleCode(code, callbackUrl);
  }

  return exchangeTikTokCode(code, callbackUrl);
}

function tokenExpired(connection) {
  return Boolean(
    connection.expiresAt &&
    new Date(connection.expiresAt).getTime() <= Date.now(),
  );
}

function expiresSoon(connection) {
  return Boolean(
    connection.expiresAt &&
    new Date(connection.expiresAt).getTime() - Date.now() < 5 * 60 * 1000,
  );
}

async function verifyMetaConnection(platform, connection) {
  const version = META_VERSION;
  const profile = await fetchJson(
    `https://graph.facebook.com/${version}/me?fields=id,name&access_token=${encodeURIComponent(connection.accessToken)}`,
  );
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  if (!appId || !appSecret) {
    throw new Error("Meta app credentials are not configured.");
  }

  const debugToken = await fetchJson(
    `https://graph.facebook.com/${version}/debug_token?input_token=${encodeURIComponent(connection.accessToken)}&access_token=${encodeURIComponent(`${appId}|${appSecret}`)}`,
  );
  const scopes = debugToken?.data?.scopes || connection.scopes || [];
  const active = Boolean(debugToken?.data?.is_valid);

  const requiredScopes =
    platform === "instagram"
      ? [
          "instagram_basic",
          "instagram_manage_insights",
          "pages_show_list",
          "pages_read_engagement",
        ]
      : ["pages_show_list", "pages_read_engagement", "read_insights"];

  const hasScopes = requiredScopes.every((scope) => scopes.includes(scope));
  return {
    accountId: profile.id,
    accountName: profile.name || `${platform} account`,
    accountType: platform === "instagram" ? "Business" : "Page",
    verified: active && hasScopes,
    scopes,
  };
}

async function verifyYouTubeConnection(connection) {
  const profile = await fetchJson(
    `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${encodeURIComponent(connection.accessToken)}`,
  );
  return {
    accountId: profile.sub,
    accountName: profile.name || profile.email || "Google account",
    accountType: "Channel",
    verified: true,
    scopes: connection.scopes || providerConfig.youtube.scopes,
  };
}

async function verifyTikTokConnection(connection) {
  const profile = await fetchJson("https://open.tiktokapis.com/v2/user/info/", {
    method: "POST",
    headers: {
      authorization: `Bearer ${connection.accessToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ fields: ["open_id", "union_id", "display_name"] }),
  });

  const user = profile?.data?.user || profile?.data?.users?.[0] || {};
  return {
    accountId: user.open_id || user.union_id || "tiktok-user",
    accountName: user.display_name || "TikTok account",
    accountType: "Creator",
    verified: true,
    scopes: connection.scopes || providerConfig.tiktok.scopes,
  };
}

export async function verifyPlatformConnection(platform, connection) {
  if (tokenExpired(connection)) {
    throw new Error("Session expired. Please reconnect your account.");
  }

  if (platform === "instagram" || platform === "facebook") {
    return verifyMetaConnection(platform, connection);
  }

  if (platform === "youtube") {
    return verifyYouTubeConnection(connection);
  }

  return verifyTikTokConnection(connection);
}

async function refreshMetaToken(connection) {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  if (!appId || !appSecret) {
    throw new Error("Meta app credentials are not configured.");
  }

  const refreshSource = connection.refreshToken || connection.accessToken;
  const response = await fetchJson(
    `https://graph.facebook.com/${META_VERSION}/oauth/access_token?grant_type=fb_exchange_token&client_id=${encodeURIComponent(appId)}&client_secret=${encodeURIComponent(appSecret)}&fb_exchange_token=${encodeURIComponent(refreshSource)}`,
  );

  return {
    ...connection,
    accessToken: response.access_token,
    refreshToken: connection.refreshToken,
    expiresAt: response.expires_in
      ? new Date(
          Date.now() + Number(response.expires_in) * 1000,
        ).toISOString()
      : connection.expiresAt,
  };
}

async function refreshGoogleToken(connection) {
  if (!connection.refreshToken) {
    throw new Error("Session expired. Please reconnect your account.");
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth credentials are not configured.");
  }

  const response = await fetchJson("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: connection.refreshToken,
    }),
  });

  return {
    ...connection,
    accessToken: response.access_token,
    refreshToken: connection.refreshToken,
    expiresAt: response.expires_in
      ? new Date(
          Date.now() + Number(response.expires_in) * 1000,
        ).toISOString()
      : connection.expiresAt,
    scopes: response.scope
      ? String(response.scope)
          .split(" ")
          .map((scope) => scope.trim())
          .filter(Boolean)
      : connection.scopes,
  };
}

async function refreshTikTokToken(connection) {
  if (!connection.refreshToken) {
    throw new Error("Session expired. Please reconnect your account.");
  }

  const clientId = process.env.TIKTOK_CLIENT_KEY;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("TikTok app credentials are not configured.");
  }

  const response = await fetchJson(
    "https://open.tiktokapis.com/v2/oauth/token/",
    {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_key: clientId,
        client_secret: clientSecret,
        grant_type: "refresh_token",
        refresh_token: connection.refreshToken,
      }),
    },
  );

  return {
    ...connection,
    accessToken: response.access_token,
    refreshToken: response.refresh_token || connection.refreshToken,
    expiresAt: response.expires_in
      ? new Date(
          Date.now() + Number(response.expires_in) * 1000,
        ).toISOString()
      : connection.expiresAt,
    scopes: response.scope
      ? String(response.scope)
          .split(",")
          .map((scope) => scope.trim())
          .filter(Boolean)
      : connection.scopes,
  };
}

export async function refreshConnectionIfNeeded(platform, connection) {
  if (!connection) {
    throw new Error("Session expired. Please reconnect your account.");
  }

  if (!tokenExpired(connection) && !expiresSoon(connection)) {
    return { connection, refreshed: false };
  }

  if (platform === "instagram" || platform === "facebook") {
    return { connection: await refreshMetaToken(connection), refreshed: true };
  }

  if (platform === "youtube") {
    return { connection: await refreshGoogleToken(connection), refreshed: true };
  }

  return { connection: await refreshTikTokToken(connection), refreshed: true };
}

function total(value) {
  return Number.isFinite(Number(value)) ? Number(value) : 0;
}

function getMetaContentType(platform, entry) {
  if (platform === "instagram") {
    if (entry.media_product_type === "REELS") return "Reel";
    if (entry.media_type === "STORY") return "Story";
    return "Post";
  }

  if (entry.is_reel) return "Reel";
  if (entry.is_video) return "Video";
  if (entry.story) return "Story";
  return "Post";
}

function engagementBase(row) {
  return {
    likes: total(row.likes),
    comments: total(row.comments),
    shares: total(row.shares),
    saves: total(row.saves),
    views: total(row.views),
    reach: total(row.reach),
  };
}

function computeTotalEngagement(row) {
  const metrics = engagementBase(row);
  return (
    metrics.likes +
    metrics.comments +
    metrics.shares +
    metrics.saves +
    metrics.views +
    metrics.reach
  );
}

async function fetchMetaLibrary(platform, connection) {
  const version = META_VERSION;
  if (platform === "instagram") {
    const media = await fetchJson(
      `https://graph.facebook.com/${version}/me/media?fields=id,caption,media_type,media_product_type,permalink,thumbnail_url,like_count,comments_count,timestamp&access_token=${encodeURIComponent(connection.accessToken)}`,
    );
    return media?.data || [];
  }

  const posts = await fetchJson(
    `https://graph.facebook.com/${version}/me/posts?fields=id,message,permalink_url,created_time,shares,reactions.summary(true).limit(0),comments.summary(true).limit(0)&access_token=${encodeURIComponent(connection.accessToken)}`,
  );
  const videos = await fetchJson(
    `https://graph.facebook.com/${version}/me/videos?fields=id,description,permalink_url,created_time,views,shares,comments.summary(true).limit(0)&access_token=${encodeURIComponent(connection.accessToken)}`,
  );
  const photos = await fetchJson(
    `https://graph.facebook.com/${version}/me/photos?fields=id,name,permalink_url,created_time,reactions.summary(true).limit(0),comments.summary(true).limit(0)&access_token=${encodeURIComponent(connection.accessToken)}`,
  );
  return [
    ...(posts?.data || []),
    ...(videos?.data || []),
    ...(photos?.data || []),
  ];
}

async function fetchInstagramMetrics(connection, rows) {
  const library = await fetchMetaLibrary("instagram", connection);
  return rows.map((row, index) => {
    const match = library.find(
      (entry) =>
        String(entry.permalink || "").replace(/\/$/, "") ===
        row.url.replace(/\/$/, ""),
    );
    if (!match) {
      throw new Error("Unable to access analytics data for this account.");
    }

    return {
      id: `${match.id || index}-${Date.now()}`,
      contentType: getMetaContentType("instagram", match),
      link: row.url,
      thumbnail: match.thumbnail_url || `https://placehold.co/80x80?text=IG`,
      caption: match.caption || "Instagram content",
      likes: total(match.like_count),
      comments: total(match.comments_count),
      saves: 0,
      shares: 0,
      reach: 0,
      impressions: 0,
      analyzedAt: new Date().toISOString(),
      totalEngagement: computeTotalEngagement({
        likes: match.like_count,
        comments: match.comments_count,
      }),
    };
  });
}

async function fetchFacebookMetrics(connection, rows) {
  const library = await fetchMetaLibrary("facebook", connection);
  return rows.map((row, index) => {
    const match = library.find(
      (entry) =>
        String(entry.permalink_url || "").replace(/\/$/, "") ===
        row.url.replace(/\/$/, ""),
    );
    if (!match) {
      throw new Error("Unable to access analytics data for this account.");
    }

    const reactions = match.reactions?.summary?.total_count || 0;
    const comments = match.comments?.summary?.total_count || 0;
    const shares = match.shares?.count || match.shares || 0;

    return {
      id: `${match.id || index}-${Date.now()}`,
      contentType: match.story
        ? "Story"
        : match.is_reel
          ? "Reel"
          : match.is_video
            ? "Video"
            : "Post",
      link: row.url,
      thumbnail:
        match.full_picture ||
        match.picture ||
        `https://placehold.co/80x80?text=FB`,
      caption: match.message || match.description || "Facebook content",
      likes: reactions,
      comments,
      shares,
      reactions,
      reach: total(
        match.insights?.data?.find((item) =>
          String(item.name).includes("reach"),
        )?.values?.[0]?.value,
      ),
      impressions: total(
        match.insights?.data?.find((item) =>
          String(item.name).includes("impression"),
        )?.values?.[0]?.value,
      ),
      analyzedAt: new Date().toISOString(),
      totalEngagement: computeTotalEngagement({
        likes: reactions,
        comments,
        shares,
        reach: 0,
        views: 0,
        saves: 0,
      }),
    };
  });
}

async function fetchTikTokMetrics(connection, rows) {
  const response = await fetchJson(
    "https://open.tiktokapis.com/v2/video/list/",
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${connection.accessToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        fields: [
          "id",
          "share_url",
          "cover_image_url",
          "title",
          "like_count",
          "comment_count",
          "share_count",
          "view_count",
        ],
      }),
    },
  );

  const videos = response?.data?.videos || response?.data?.items || [];
  return rows.map((row, index) => {
    const match = videos.find(
      (entry) =>
        String(entry.share_url || "").replace(/\/$/, "") ===
        row.url.replace(/\/$/, ""),
    );
    if (!match) {
      throw new Error("Unable to access analytics data for this account.");
    }

    return {
      id: `${match.id || index}-${Date.now()}`,
      link: row.url,
      thumbnail: match.cover_image_url || `https://placehold.co/80x80?text=TT`,
      title: match.title || "TikTok video",
      likes: total(match.like_count),
      comments: total(match.comment_count),
      shares: total(match.share_count),
      views: total(match.view_count),
      saves: total(match.favorite_count || match.favourite_count),
      analyzedAt: new Date().toISOString(),
      totalEngagement: computeTotalEngagement({
        likes: match.like_count,
        comments: match.comment_count,
        shares: match.share_count,
        saves: match.favorite_count || 0,
        views: match.view_count,
      }),
    };
  });
}

async function fetchYouTubeMetrics(connection, rows) {
  return Promise.all(
    rows.map(async (row, index) => {
      const videoIdMatch = row.url.match(
        /(?:v=|shorts\/|youtu\.be\/)([A-Za-z0-9_-]{6,})/,
      );
      if (!videoIdMatch) {
        throw new Error("Invalid content URL detected.");
      }

      const videoId = videoIdMatch[1];
      const response = await fetchJson(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${encodeURIComponent(videoId)}&access_token=${encodeURIComponent(connection.accessToken)}`,
      );
      const video = response?.items?.[0];
      if (!video) {
        throw new Error("Unable to access analytics data for this account.");
      }

      const statistics = video.statistics || {};
      const kind =
        row.contentType || (row.url.includes("/shorts/") ? "Short" : "Video");
      return {
        id: `${video.id || index}-${Date.now()}`,
        contentType: kind,
        link: row.url,
        thumbnail:
          video.snippet?.thumbnails?.default?.url ||
          `https://placehold.co/80x80?text=YT`,
        title: video.snippet?.title || "YouTube video",
        likes: total(statistics.likeCount),
        comments: total(statistics.commentCount),
        views: total(statistics.viewCount),
        shares: 0,
        watchTimeHours: 0,
        subscribersGained: 0,
        analyzedAt: new Date().toISOString(),
        totalEngagement: computeTotalEngagement({
          likes: statistics.likeCount,
          comments: statistics.commentCount,
          views: statistics.viewCount,
        }),
      };
    }),
  );
}

export async function fetchPlatformAnalyses(platform, connection, rows) {
  if (platform === "instagram") {
    return fetchInstagramMetrics(connection, rows);
  }

  if (platform === "facebook") {
    return fetchFacebookMetrics(connection, rows);
  }

  if (platform === "tiktok") {
    return fetchTikTokMetrics(connection, rows);
  }

  return fetchYouTubeMetrics(connection, rows);
}
