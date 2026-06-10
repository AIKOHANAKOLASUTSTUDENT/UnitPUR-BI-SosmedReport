import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
  bootstrapState,
  clearPlatformData,
  getConnection,
  listPlatformData,
  saveConnection,
  savePlatformData,
} from './lib/store.js';
import {
  buildAuthorizationUrl,
  exchangeAuthorizationCode,
  fetchPlatformAnalyses,
  getPlatformConfig,
  verifyPlatformConnection,
} from './lib/providers.js';
import { buildExportFile } from './lib/export.js';
import {
  normalizePlatformKey,
  parseContentRows,
  validatePlatform,
} from './lib/validation.js';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 8787);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));

const pendingAuthStates = new Map();

function sendAuthMessagePage(res, payload) {
  const frontendOrigin = payload.frontendOrigin || '*';
  const message = JSON.stringify(payload.message);
  res.type('html').send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Authentication Complete</title>
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
            window.opener.postMessage(${message}, ${JSON.stringify(frontendOrigin)});
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

app.get('/api/bootstrap', (_req, res) => {
  res.json(bootstrapState());
});

app.get('/api/platforms/:platform/connect/start', async (req, res) => {
  try {
    const platform = validatePlatform(req.params.platform);
    const frontendOrigin = String(req.query.frontendOrigin || '').trim() || `${req.protocol}://${req.get('host')}`;
    const state = randomUUID();
    const callbackUrl = `${req.protocol}://${req.get('host')}/api/platforms/${platform}/callback`;

    pendingAuthStates.set(state, {
      platform,
      frontendOrigin,
      callbackUrl,
      createdAt: Date.now(),
    });

    const authorizationUrl = buildAuthorizationUrl(platform, {
      state,
      callbackUrl,
    });

    res.json({ authorizationUrl, state, callbackUrl });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Unable to start authentication.' });
  }
});

app.get('/api/platforms/:platform/callback', async (req, res) => {
  const platform = normalizePlatformKey(req.params.platform);
  const state = String(req.query.state || '');
  const code = String(req.query.code || '');
  const oauthError = String(req.query.error || '');

  const pending = pendingAuthStates.get(state);
  if (!pending || pending.platform !== platform) {
    return sendAuthMessagePage(res, {
      title: 'Login failed',
      description: 'Login failed. Please check your account permissions and try again.',
      frontendOrigin: pending?.frontendOrigin,
      message: { type: 'platform-auth-failed', platform, error: 'Invalid OAuth state.' },
    });
  }

  pendingAuthStates.delete(state);

  if (oauthError) {
    return sendAuthMessagePage(res, {
      title: 'Login failed',
      description: 'Login failed. Please check your account permissions and try again.',
      frontendOrigin: pending.frontendOrigin,
      message: { type: 'platform-auth-failed', platform, error: oauthError },
    });
  }

  try {
    const tokenResult = await exchangeAuthorizationCode(platform, code, pending.callbackUrl);
    const verification = await verifyPlatformConnection(platform, tokenResult);

    saveConnection(platform, {
      platform,
      connected: true,
      accountId: verification.accountId,
      accountName: verification.accountName,
      accountType: verification.accountType,
      verified: verification.verified,
      scopes: tokenResult.scopes,
      accessToken: tokenResult.accessToken,
      refreshToken: tokenResult.refreshToken,
      expiresAt: tokenResult.expiresAt,
      updatedAt: new Date().toISOString(),
    });

    return sendAuthMessagePage(res, {
      title: 'Login successful',
      description: 'Your account is connected and ready for analysis.',
      frontendOrigin: pending.frontendOrigin,
      message: { type: 'platform-auth-success', platform },
    });
  } catch (error) {
    return sendAuthMessagePage(res, {
      title: 'Login failed',
      description: 'Login failed. Please check your account permissions and try again.',
      frontendOrigin: pending.frontendOrigin,
      message: {
        type: 'platform-auth-failed',
        platform,
        error: error instanceof Error ? error.message : 'Authentication failed.',
      },
    });
  }
});

app.get('/api/platforms/:platform/status', (req, res) => {
  try {
    const platform = validatePlatform(req.params.platform);
    const connection = getConnection(platform);
    res.json({ connection });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Unable to read platform status.' });
  }
});

app.post('/api/platforms/:platform/disconnect', (req, res) => {
  try {
    const platform = validatePlatform(req.params.platform);
    saveConnection(platform, null);
    clearPlatformData(platform);
    res.json({ ok: true });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Unable to disconnect platform.' });
  }
});

app.post('/api/platforms/:platform/analyze', async (req, res) => {
  try {
    const platform = validatePlatform(req.params.platform);
    const parsed = z.object({
      rows: z.array(z.object({
        url: z.string().min(1),
        contentType: z.string().optional(),
      })).min(1),
    }).parse(req.body);

    const rows = parseContentRows(platform, parsed.rows);
    const connection = getConnection(platform);
    if (!connection?.connected) {
      return res.status(401).json({ error: 'Session expired. Please reconnect your account.', code: 'SESSION_EXPIRED' });
    }

    const analyses = await fetchPlatformAnalyses(platform, connection, rows);
    savePlatformData(platform, analyses);

    res.json({
      message: 'Engagement report generated successfully.',
      analyses,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to analyze content.';
    const status = message.includes('Invalid content URL detected') ? 400 : message.includes('Session expired') ? 401 : 500;
    res.status(status).json({ error: message, code: status === 401 ? 'SESSION_EXPIRED' : 'ANALYSIS_FAILED' });
  }
});

app.get('/api/platforms/:platform/data', (req, res) => {
  try {
    const platform = validatePlatform(req.params.platform);
    res.json({ data: listPlatformData(platform) });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Unable to fetch platform data.' });
  }
});

app.post('/api/platforms/:platform/export', (req, res) => {
  try {
    const platform = validatePlatform(req.params.platform);
    const body = z.object({
      format: z.enum(['csv', 'xlsx']),
      fields: z.array(z.string().min(1)).min(1),
    }).parse(req.body);

    const connection = getConnection(platform);
    if (!connection?.connected) {
      return res.status(401).json({ error: 'Session expired. Please reconnect your account.', code: 'SESSION_EXPIRED' });
    }

    const data = listPlatformData(platform);
    if (data.length === 0) {
      return res.status(400).json({ error: `No ${platform} data to export.` });
    }

    const file = buildExportFile(platform, body.format, body.fields, data);
    res.setHeader('Content-Type', file.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
    res.send(file.buffer);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Unable to export data.' });
  }
});

app.get('/api/platforms/:platform/config', (req, res) => {
  try {
    const platform = validatePlatform(req.params.platform);
    res.json({ config: getPlatformConfig(platform) });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Unable to read platform config.' });
  }
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'social-engagement-api' });
});

app.listen(port, () => {
  console.log(`API server listening on http://127.0.0.1:${port}`);
});
