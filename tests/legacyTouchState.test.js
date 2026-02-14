import test from 'node:test';
import assert from 'node:assert/strict';
import { beginLegacyPinch, endLegacyPinch, updateLegacyPinch } from '../src/render/legacyTouchState.js';

test('beginLegacyPinch activates pinch state and seeds pinch distance', () => {
  const touchState = { isPinching: false, pinchDistance: 0 };
  beginLegacyPinch(
    touchState,
    { clientX: 0, clientY: 0 },
    { clientX: 3, clientY: 4 },
    () => 5,
  );
  assert.deepEqual(touchState, {
    isPinching: true,
    pinchDistance: 5,
  });
});

test('updateLegacyPinch is no-op when pinch is inactive', () => {
  const touchState = { isPinching: false, pinchDistance: 12 };
  const result = updateLegacyPinch(
    touchState,
    { clientX: 0, clientY: 0 },
    { clientX: 6, clientY: 8 },
    () => 10,
    () => ({ radius: 20, distance: 10 }),
    15,
    0.04,
  );
  assert.deepEqual(result, {
    active: false,
    radius: 15,
    distance: 12,
  });
});

test('updateLegacyPinch updates radius and stored pinch distance', () => {
  const touchState = { isPinching: true, pinchDistance: 20 };
  const result = updateLegacyPinch(
    touchState,
    { clientX: 0, clientY: 0 },
    { clientX: 9, clientY: 12 },
    () => 15,
    (radius, previousDistance, currentDistance, pinchFactor) => ({
      radius: radius + (previousDistance - currentDistance) * pinchFactor,
      distance: currentDistance,
    }),
    42,
    0.1,
  );
  assert.deepEqual(result, {
    active: true,
    radius: 42.5,
    distance: 15,
  });
  assert.equal(touchState.pinchDistance, 15);
});

test('endLegacyPinch deactivates pinch state', () => {
  const touchState = { isPinching: true, pinchDistance: 17 };
  endLegacyPinch(touchState);
  assert.equal(touchState.isPinching, false);
  assert.equal(touchState.pinchDistance, 17);
});

