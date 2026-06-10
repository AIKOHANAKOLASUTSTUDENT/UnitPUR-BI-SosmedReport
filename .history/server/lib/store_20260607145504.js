import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { encryptToken, decryptToken } from './crypto.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, '..', 'data');
const storePath = path.join(dataDir, 'store.json');

function ensureStoreShape(store) {
  return {
    connections: {
      instagram: null,
      facebook: null,
      tiktok: null,
      youtube: null,
      ...(store?.connections || {}),
    },
    data: {
      instagram: [],
      facebook: [],
      tiktok: [],
      youtube: [],
      ...(store?.data || {}),
    },
  };
}

function readStoreFile() {
  if (!fs.existsSync(storePath)) {
    return ensureStoreShape();
  }

  const parsed = JSON.parse(fs.readFileSync(storePath, 'utf8'));
  return ensureStoreShape(parsed);
}

function writeStoreFile(store) {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
}

function mapConnection(connection) {
  if (!connection) {
    return null;
  }

  return {
    ...connection,
    accessToken: connection.accessToken ? decryptToken(connection.accessToken) : '',
    refreshToken: connection.refreshToken ? decryptToken(connection.refreshToken) : '',
  };
}

function mapPersistedConnection(connection) {
  if (!connection) {
    return null;
  }

  return {
    ...connection,
    accessToken: connection.accessToken ? encryptToken(connection.accessToken) : '',
    refreshToken: connection.refreshToken ? encryptToken(connection.refreshToken) : '',
  };
}

export function bootstrapState() {
  const store = readStoreFile();
  return {
    platformAuth: Object.fromEntries(Object.entries(store.connections).map(([key, value]) => [key, Boolean(value?.connected && value?.verified)])),
    platformConnections: Object.fromEntries(Object.entries(store.connections).map(([key, value]) => [key, mapConnection(value)])),
    instagramPosts: store.data.instagram,
    facebookPosts: store.data.facebook,
    tiktokPosts: store.data.tiktok,
    youtubePosts: store.data.youtube,
  };
}

export function getConnection(platform) {
  const store = readStoreFile();
  return mapConnection(store.connections[platform]);
}

export function saveConnection(platform, connection) {
  const store = readStoreFile();
  store.connections[platform] = connection ? mapPersistedConnection(connection) : null;
  writeStoreFile(store);
}

export function clearPlatformData(platform) {
  const store = readStoreFile();
  store.data[platform] = [];
  writeStoreFile(store);
}

export function savePlatformData(platform, rows) {
  const store = readStoreFile();
  store.data[platform] = rows;
  writeStoreFile(store);
}

export function listPlatformData(platform) {
  const store = readStoreFile();
  return store.data[platform] || [];
}
