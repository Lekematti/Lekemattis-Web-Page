import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { createVisitsDb } = require('../src/visitsDb.js');

async function withTempDir(fn) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'lekemattis-web-page-'));
  try {
    return await fn(dir);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
}

test('recordVisit increments only for new visitorId', async () => {
  await withTempDir(async (dir) => {
    const dbFile = path.join(dir, 'visits.sqlite');
    const visitsDb = createVisitsDb({ dbFile });

    try {
      const first = visitsDb.recordVisit('a');
      assert.equal(first.isNewVisitor, true);
      assert.equal(first.count, 1);

      const second = visitsDb.recordVisit('a');
      assert.equal(second.isNewVisitor, false);
      assert.equal(second.count, 1);

      const third = visitsDb.recordVisit('b');
      assert.equal(third.isNewVisitor, true);
      assert.equal(third.count, 2);
    } finally {
      visitsDb.close();
    }
  });
});

test('migrateFromLegacyJsonIfNeeded seeds count only when DB is empty', async () => {
  await withTempDir(async (dir) => {
    const dbFile = path.join(dir, 'visits.sqlite');
    const legacyFile = path.join(dir, 'visits.json');

    await fs.writeFile(legacyFile, JSON.stringify({ count: 5 }), 'utf8');

    const visitsDb = createVisitsDb({ dbFile, legacyJsonFile: legacyFile });

    try {
      assert.equal(visitsDb.getCount(), 0);

      const first = await visitsDb.migrateFromLegacyJsonIfNeeded();
      assert.deepEqual(first, { migrated: true, legacyCount: 5 });
      assert.equal(visitsDb.getCount(), 5);

      const second = await visitsDb.migrateFromLegacyJsonIfNeeded();
      assert.deepEqual(second, { migrated: false });
      assert.equal(visitsDb.getCount(), 5);

      // If DB already has a count, migration should not overwrite it.
      visitsDb.recordVisit('new');
      assert.equal(visitsDb.getCount(), 6);

      const third = await visitsDb.migrateFromLegacyJsonIfNeeded();
      assert.deepEqual(third, { migrated: false });
      assert.equal(visitsDb.getCount(), 6);
    } finally {
      visitsDb.close();
    }
  });
});
