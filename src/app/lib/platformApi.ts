import type { PlatformKey } from "./content";

const API_BASE =
  (import.meta as unknown as { env?: { VITE_API_BASE_URL?: string } }).env
    ?.VITE_API_BASE_URL || "";

// If VITE_API_BASE_URL is not configured, keep backward compatibility with same-origin /api.
const API_BASE_FALLBACK = API_BASE || "/api";

function normalizeErrorMessage(error: unknown) {
  if (error instanceof Error) {
    const message = error.message || "Request failed";
    const code = (error as Error & { code?: string }).code;

    if (code === "SESSION_EXPIRED" || message.includes("Session expired")) {
      return "Session expired. Please reconnect your account.";
    }

    if (message.includes("Invalid content URL detected")) {
      return "Invalid content URL detected.";
    }

    if (message.includes("Unable to access analytics data")) {
      return "Unable to access analytics data for this account.";
    }

    if (message.includes("Login failed")) {
      return "Login failed. Please check your account permissions and try again.";
    }

    return message;
  }

  return "Request failed";
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: {
      "content-type": "application/json",
      ...(init?.headers || {}),
    },
    ...init,
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body?.error || "Request failed");
    (error as Error & { code?: string; status?: number }).code = body?.code;
    (error as Error & { code?: string; status?: number }).status =
      response.status;
    throw error;
  }

  return body as T;
}

export async function loadBootstrap() {
  const bootstrap = await requestJson<{
    platformAuth?: Record<PlatformKey, boolean> | null;
    platformConnections?: Record<string, unknown> | null;
    instagramPosts?: Array<Record<string, unknown>> | null;
    facebookPosts?: Array<Record<string, unknown>> | null;
    tiktokPosts?: Array<Record<string, unknown>> | null;
    youtubePosts?: Array<Record<string, unknown>> | null;
  }>("/bootstrap");

  // eslint-disable-next-line no-console
  console.log("[bootstrap] API Response:", bootstrap);

  return {
    platformAuth: bootstrap?.platformAuth ?? {
      instagram: false,
      tiktok: false,
      youtube: false,
      facebook: false,
    },
    platformConnections: bootstrap?.platformConnections ?? {},
    instagramPosts: bootstrap?.instagramPosts ?? [],
    facebookPosts: bootstrap?.facebookPosts ?? [],
    tiktokPosts: bootstrap?.tiktokPosts ?? [],
    youtubePosts: bootstrap?.youtubePosts ?? [],
  };
}

export async function startPlatformConnection(platform: PlatformKey) {
  // Required debug logs
  console.log("[CONNECT] API_BASE =", API_BASE);

  const frontendOrigin = window.location.origin;

  const payload = await requestJson<{
    authorizationUrl: string;
    callbackUrl: string;
  }>(
    `/platforms/${platform}/connect/start?frontendOrigin=${encodeURIComponent(
      frontendOrigin,
    )}`,
  );

  console.log("[CONNECT] payload =", payload);
  console.log("[CONNECT] authorizationUrl =", payload?.authorizationUrl);

  const finalAuthorizationUrl = payload?.authorizationUrl;
  if (!finalAuthorizationUrl) {
    // If backend returns relative URL, we still log payload above.
    throw new Error(
      "Missing authorizationUrl from backend connect start. (See payload log)",
    );
  }

  // Must not navigate to /dashboard/instagram/connect or /instagram/connect.
  const popup = window.open(
    finalAuthorizationUrl,
    "instagram-oauth",
    "width=620,height=760",
  );

  if (!popup) {
    throw new Error("Unable to open the login popup.");
  }

  const callbackUrl = payload?.callbackUrl;
  const allowedOrigin = callbackUrl
    ? new URL(callbackUrl).origin
    : window.location.origin;

  return new Promise<void>((resolve, reject) => {
    const timeoutId = window.setTimeout(
      () => {
        cleanup();
        reject(
          new Error(
            "Login failed. Please check your account permissions and try again.",
          ),
        );
      },
      5 * 60 * 1000,
    );

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== allowedOrigin) return;
      if (!event.data || event.data.platform !== platform) return;

      if (event.data.type === "platform-auth-success") {
        cleanup();
        resolve();
        return;
      }

      cleanup();
      reject(
        new Error(
          event.data.error ||
            "Login failed. Please check your account permissions and try again.",
        ),
      );
    };

    const pollId = window.setInterval(() => {
      if ((popup as WindowProxy).closed) {
        cleanup();
        reject(
          new Error(
            "Login failed. Please check your account permissions and try again.",
          ),
        );
      }
    }, 750);

    function cleanup() {
      window.clearTimeout(timeoutId);
      window.clearInterval(pollId);
      window.removeEventListener("message", handleMessage);
      try {
        (popup as WindowProxy).close();
      } catch {
        // ignore
      }
    }

    window.addEventListener("message", handleMessage);
  });
}

export async function analyzePlatformContent(
  platform: PlatformKey,
  rows: Array<{ url: string; contentType?: string }>,
) {
  return requestJson<{
    message: string;
    analyses: Array<Record<string, unknown>>;
  }>(`/platforms/${platform}/analyze`, {
    method: "POST",
    body: JSON.stringify({ rows }),
  });
}

export async function disconnectPlatform(platform: PlatformKey) {
  return requestJson<{ ok: boolean }>(`/platforms/${platform}/disconnect`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function exportPlatformData(
  platform: PlatformKey,
  format: "csv" | "xlsx",
  fields: string[],
) {
  const response = await fetch(
    `${API_BASE_FALLBACK}/platforms/${platform}/export`,
    {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ format, fields }),
    },
  );

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const error = new Error(body?.error || "Export failed");
    (error as Error & { code?: string; status?: number }).code = body?.code;
    (error as Error & { code?: string; status?: number }).status =
      response.status;
    throw error;
  }

  return response.blob();
}

export function getFriendlyErrorMessage(error: unknown) {
  return normalizeErrorMessage(error);
}
