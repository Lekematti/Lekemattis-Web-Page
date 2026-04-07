const http = require('node:http');
const crypto = require('node:crypto');
const path = require('node:path');

const { createVisitsDb } = require('./visitsDb.js');

const PORT = Number(process.env.PORT ?? 3001);

const LEGACY_VISITS_FILE = process.env.VISITS_FILE
  ? path.resolve(process.env.VISITS_FILE)
  : path.resolve(__dirname, '..', 'data', 'visits.json');

const VISITS_DB_FILE = process.env.VISITS_DB_FILE
  ? path.resolve(process.env.VISITS_DB_FILE)
  : path.resolve(__dirname, '..', 'data', 'visits.sqlite');

const visitsDb = createVisitsDb({
  dbFile: VISITS_DB_FILE,
  legacyJsonFile: LEGACY_VISITS_FILE,
});

function sendJson(res, statusCode, body) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(`${JSON.stringify(body)}\n`);
}

function parseAllowedOrigins() {
  const raw = String(process.env.CORS_ORIGIN ?? '').trim();
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function setCors(req, res) {
  const allowedOrigins = parseAllowedOrigins();
  const origin = String(req.headers.origin ?? '').trim();

  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (allowedOrigins.length === 0) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    return;
  }

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
}

function parseCookies(cookieHeader) {
  const header = String(cookieHeader ?? '');
  if (!header) return {};

  const out = {};
  for (const part of header.split(';')) {
    const [rawName, ...rest] = part.trim().split('=');
    if (!rawName) continue;
    const rawValue = rest.join('=');
    out[rawName] = decodeURIComponent(rawValue ?? '');
  }
  return out;
}

function setCookie(res, name, value, { maxAgeSeconds } = {}) {
  const sameSite = String(
    process.env.COOKIE_SAMESITE ?? (process.env.NODE_ENV === 'production' ? 'None' : 'Lax'),
  ).trim();

  const parts = [`${name}=${encodeURIComponent(value)}`, 'Path=/', 'HttpOnly'];

  if (sameSite) parts.push(`SameSite=${sameSite}`);
  if (sameSite.toLowerCase() === 'none') parts.push('Secure');
  if (typeof maxAgeSeconds === 'number') parts.push(`Max-Age=${Math.floor(maxAgeSeconds)}`);
  res.setHeader('Set-Cookie', parts.join('; '));
}

function newVisitorId() {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return crypto.randomBytes(16).toString('hex');
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);

  if (url.pathname.startsWith('/api/')) {
    setCors(req, res);

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    if (url.pathname === '/api/visits' && req.method === 'GET') {
      const count = visitsDb.getCount();
      sendJson(res, 200, { count });
      return;
    }

    if (url.pathname === '/api/visits' && req.method === 'POST') {
      const cookies = parseCookies(req.headers.cookie);
      const existingVisitorId = cookies.visitorId;

      const visitorId = existingVisitorId || newVisitorId();
      if (!existingVisitorId) {
        setCookie(res, 'visitorId', visitorId, { maxAgeSeconds: 60 * 60 * 24 * 365 });
      }

      const result = visitsDb.recordVisit(visitorId);
      sendJson(res, 200, { count: result.count });
      return;
    }

    sendJson(res, 404, { error: 'Not found' });
    return;
  }

  sendJson(res, 404, { error: 'Not found' });
});

(async () => {
  try {
    const { migrated, legacyCount } = await visitsDb.migrateFromLegacyJsonIfNeeded();
    if (migrated) console.log(`Migrated legacy visits.json count: ${legacyCount}`);
  } catch {
    // ignore migration errors; DB will still work
  }

  server.listen(PORT, () => {
    console.log(`Backend listening on http://localhost:${PORT}`);
    console.log(`Visits DB: ${visitsDb.dbFile}`);
  });
})();
