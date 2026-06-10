function toStringList(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(/[\s,]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

export function fetchJson(url, options = {}) {
  return fetch(url, {
    ...options,
    headers: {
      accept: 'application/json',
      ...(options.headers || {}),
    },
  }).then(async (response) => {
    const text = await response.text();
    const body = text ? JSON.parse(text) : {};
    if (!response.ok) {
      const message =
        body?.error?.message ||
        body?.error?.error_user_msg ||
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

export function buildAuthorizationUrl(baseUrl, params) {
  const url = new URL(baseUrl);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

export function normalizeScopes(value) {
  return toStringList(value);
}

export function normalizeExpiry(expiresIn) {
  if (!expiresIn) {
    return null;
  }

  return new Date(Date.now() + Number(expiresIn) * 1000);
}

export function ensureScopes({ platform, grantedScopes, requiredScopes }) {
  const missing = requiredScopes.filter((scope) => !grantedScopes.includes(scope));
  if (missing.length) {
    throw new Error(`Missing required permissions for ${platform}.`);
  }

  return grantedScopes;
}
