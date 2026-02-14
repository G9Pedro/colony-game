import test from 'node:test';
import assert from 'node:assert/strict';
import { pickBestInteractiveEntityHit } from '../src/render/interactionHitTest.js';

test('pickBestInteractiveEntityHit chooses deepest entity under pointer', () => {
  const hit = pickBestInteractiveEntityHit([
    {
      centerX: 10,
      centerY: 20,
      halfWidth: 8,
      halfHeight: 8,
      depth: 4,
      entity: { id: 'shallow' },
    },
    {
      centerX: 10,
      centerY: 20,
      halfWidth: 8,
      halfHeight: 8,
      depth: 9,
      entity: { id: 'deep' },
    },
  ], 12, 23);

  assert.equal(hit?.entity?.id, 'deep');
});

test('pickBestInteractiveEntityHit returns null when pointer misses all entities', () => {
  const hit = pickBestInteractiveEntityHit([
    {
      centerX: 0,
      centerY: 0,
      halfWidth: 2,
      halfHeight: 2,
      depth: 1,
      entity: { id: 'only' },
    },
  ], 50, 50);

  assert.equal(hit, null);
});

