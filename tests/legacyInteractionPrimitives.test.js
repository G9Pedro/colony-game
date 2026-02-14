import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getTouchDistance,
  hasPointerMovedBeyondThreshold,
  toPointerLikeTouch,
  toRoundedGroundPoint,
} from '../src/render/legacyInteractionPrimitives.js';

test('hasPointerMovedBeyondThreshold respects movement threshold', () => {
  assert.equal(hasPointerMovedBeyondThreshold(0.5, 0.9, 1), false);
  assert.equal(hasPointerMovedBeyondThreshold(1.1, 0, 1), true);
  assert.equal(hasPointerMovedBeyondThreshold(0, -1.2, 1), true);
});

test('toRoundedGroundPoint rounds world points and handles null', () => {
  assert.equal(toRoundedGroundPoint(null), null);
  assert.deepEqual(toRoundedGroundPoint({ x: 2.2, z: -3.8 }), { x: 2, z: -4 });
});

test('touch helpers compute distance and pointer-like shape', () => {
  const first = { clientX: 10, clientY: 10 };
  const second = { clientX: 13, clientY: 14 };
  assert.equal(getTouchDistance(first, second), 5);
  assert.deepEqual(toPointerLikeTouch(second), { clientX: 13, clientY: 14 });
});

