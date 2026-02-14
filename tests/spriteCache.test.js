import test from 'node:test';
import assert from 'node:assert/strict';
import { getOrCreateCachedSprite } from '../src/render/spriteCache.js';

test('getOrCreateCachedSprite returns existing cached value without recreation', () => {
  const cache = new Map([['key', { id: 1 }]]);
  let buildCalls = 0;
  const result = getOrCreateCachedSprite(cache, 'key', () => {
    buildCalls += 1;
    return { id: 2 };
  });

  assert.deepEqual(result, { id: 1 });
  assert.equal(buildCalls, 0);
});

test('getOrCreateCachedSprite creates and caches missing value', () => {
  const cache = new Map();
  const created = { id: 9 };
  const result = getOrCreateCachedSprite(cache, 'new', () => created);

  assert.equal(result, created);
  assert.equal(cache.get('new'), created);
});

