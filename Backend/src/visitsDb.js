const fs = require('node:fs/promises');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

function parseLegacyJsonCount(raw) {
  try {
    const parsed = JSON.parse(String(raw));
    const count = Number(parsed?.count);
    return Number.isFinite(count) ? count : null;
  } catch {
    return null;
  }
}

async function readLegacyCountIfExists(legacyJsonFile) {
  if (!legacyJsonFile) return null;
  try {
    const raw = await fs.readFile(legacyJsonFile, 'utf8');
    return parseLegacyJsonCount(raw);
  } catch {
    return null;
  }
}

function withImmediateTransaction(db, fn) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (err) {
    try {
      db.exec('ROLLBACK');
    } catch {
      // ignore rollback errors
    }
    throw err;
  }
}

function createVisitsDb({ dbFile, legacyJsonFile } = {}) {
  const resolvedDbFile = dbFile ? path.resolve(dbFile) : null;
  if (!resolvedDbFile) throw new Error('VISITS_DB_FILE must be set');

  const dbDir = path.dirname(resolvedDbFile);

  // Ensure directory exists before opening.
  // DatabaseSync will create the file, but not the folders.
  require('node:fs').mkdirSync(dbDir, { recursive: true });

  const db = new DatabaseSync(resolvedDbFile);

  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA synchronous = NORMAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS visits (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      count INTEGER NOT NULL
    );
  `);

  db.exec(`
    INSERT OR IGNORE INTO visits (id, count)
    VALUES (1, 0);
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS visitors (
      visitor_id TEXT PRIMARY KEY,
      first_seen_at INTEGER NOT NULL
    );
  `);

  const getCountStmt = db.prepare('SELECT count FROM visits WHERE id = 1');
  const setCountStmt = db.prepare('UPDATE visits SET count = ? WHERE id = 1');
  const incrementStmt = db.prepare('UPDATE visits SET count = count + 1 WHERE id = 1');
  const insertVisitorStmt = db.prepare(
    'INSERT OR IGNORE INTO visitors (visitor_id, first_seen_at) VALUES (?, ?)'
  );

  const getCount = () => {
    const row = getCountStmt.get();
    const count = Number(row?.count);
    return Number.isFinite(count) ? count : 0;
  };

  const migrateFromLegacyJsonIfNeeded = async () => {
    const legacyCount = await readLegacyCountIfExists(legacyJsonFile);
    if (!Number.isFinite(legacyCount)) return { migrated: false };

    const current = getCount();
    if (current > 0) return { migrated: false };

    withImmediateTransaction(db, () => {
      setCountStmt.run(Number(legacyCount));
    });

    return { migrated: true, legacyCount };
  };

  const recordVisit = (visitorId) => {
    const now = Date.now();

    return withImmediateTransaction(db, () => {
      const insertResult = insertVisitorStmt.run(String(visitorId), now);
      if (insertResult.changes === 1) {
        incrementStmt.run();
      }

      return {
        count: getCount(),
        isNewVisitor: insertResult.changes === 1,
      };
    });
  };

  return {
    dbFile: resolvedDbFile,
    getCount,
    recordVisit,
    migrateFromLegacyJsonIfNeeded,
    close: () => {
      if (typeof db.close === 'function') db.close();
    },
  };
}

module.exports = {
  createVisitsDb,
};
