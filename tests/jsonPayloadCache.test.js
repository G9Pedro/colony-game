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

test('loadJsonPayloadOrCompute recovers invalid JSON when enabled', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'payload-cache-test-'));
  const path = join(dir, 'payload.json');
  await writeFile(path, '{"broken": ', 'utf-8');

  const result = await loadJsonPayloadOrCompute({
    path,
    recoverOnParseError: true,
    computePayload: () => ({ ok: true, version: 3 }),
  });

  assert.equal(result.source, 'recovered-from-invalid-json');
  assert.deepEqual(result.payload, { ok: true, version: 3 });
  const persisted = JSON.parse(await readFile(path, 'utf-8'));
  assert.deepEqual(persisted, { ok: true, version: 3 });
});

test('loadJsonPayloadOrCompute throws on invalid JSON by default', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'payload-cache-test-'));
  const path = join(dir, 'payload.json');
  await writeFile(path, '{"broken": ', 'utf-8');

  await assert.rejects(
    () =>
      loadJsonPayloadOrCompute({
        path,
        computePayload: () => ({ ok: false }),
      }),
    SyntaxError,
  );
});

test('loadJsonPayloadOrCompute recovers invalid payload shape when enabled', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'payload-cache-test-'));
  const path = join(dir, 'payload.json');
  await writeFile(path, JSON.stringify({ malformed: true }), 'utf-8');

  const result = await loadJsonPayloadOrCompute({
    path,
    validatePayload: (payload) => Array.isArray(payload.items),
    recoverOnInvalidPayload: true,
    computePayload: () => ({ items: [1, 2, 3] }),
  });

  assert.equal(result.source, 'recovered-from-invalid-payload');
  assert.deepEqual(result.payload, { items: [1, 2, 3] });
  const persisted = JSON.parse(await readFile(path, 'utf-8'));
  assert.deepEqual(persisted, { items: [1, 2, 3] });
});

test('loadJsonPayloadOrCompute throws on invalid payload shape by default', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'payload-cache-test-'));
  const path = join(dir, 'payload.json');
  await writeFile(path, JSON.stringify({ malformed: true }), 'utf-8');

  await assert.rejects(
    () =>
      loadJsonPayloadOrCompute({
        path,
        validatePayload: (payload) => Array.isArray(payload.items),
        computePayload: () => ({ items: [] }),
      }),
    /failed validation/i,
  );
});

test('loadJsonPayloadOrCompute throws when computed payload fails validation', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'payload-cache-test-'));
  const path = join(dir, 'payload.json');

  await assert.rejects(
    () =>
      loadJsonPayloadOrCompute({
        path,
        validatePayload: (payload) => Array.isArray(payload.items),
        computePayload: () => ({ malformed: true }),
      }),
    /computed payload .* failed validation/i,
  );
});

test('loadJsonPayloadOrCompute throws when recomputed payload still fails validation', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'payload-cache-test-'));
  const path = join(dir, 'payload.json');
  await writeFile(path, JSON.stringify({ malformed: true }), 'utf-8');

  await assert.rejects(
    () =>
      loadJsonPayloadOrCompute({
        path,
        validatePayload: (payload) => Array.isArray(payload.items),
        recoverOnInvalidPayload: true,
        computePayload: () => ({ malformedAgain: true }),
      }),
    /recomputed payload .* failed validation/i,
  );
});

test('loadJsonPayloadOrCompute throws read error for unreadable cache path', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'payload-cache-test-'));

  await assert.rejects(
    () =>
      loadJsonPayloadOrCompute({
        path: dir,
        computePayload: () => ({ ok: true }),
      }),
    (error) =>
      error instanceof Error &&
      error.code === 'EISDIR' &&
      error.message.includes('Unable to read cached payload'),
  );
});
