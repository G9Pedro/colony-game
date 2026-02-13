import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { loadJsonPayloadOrCompute } from '../scripts/jsonPayloadCache.js';

test('loadJsonPayloadOrCompute computes and writes payload when file missing', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'payload-cache-test-'));
  const path = join(dir, 'payload.json');

  const result = await loadJsonPayloadOrCompute({
    path,
    computePayload: () => ({ ok: true, version: 1 }),
  });

  assert.equal(result.source, 'computed');
  assert.deepEqual(result.payload, { ok: true, version: 1 });
  const persisted = JSON.parse(await readFile(path, 'utf-8'));
  assert.deepEqual(persisted, { ok: true, version: 1 });
});

test('loadJsonPayloadOrCompute returns file payload when file exists', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'payload-cache-test-'));
  const path = join(dir, 'payload.json');
  await writeFile(path, JSON.stringify({ ok: true, version: 2 }), 'utf-8');

  let computeCalls = 0;
  const result = await loadJsonPayloadOrCompute({
    path,
    computePayload: () => {
      computeCalls += 1;
      return { ok: false };
    },
  });

  assert.equal(result.source, 'file');
  assert.deepEqual(result.payload, { ok: true, version: 2 });
  assert.equal(computeCalls, 0);
});
