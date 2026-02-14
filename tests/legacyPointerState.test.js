import test from 'node:test';
import assert from 'node:assert/strict';
import {
  beginLegacyPointerDrag,
  endLegacyPointerDrag,
  updateLegacyPointerDrag,
} from '../src/render/legacyPointerState.js';

test('beginLegacyPointerDrag initializes active drag state', () => {
  const dragState = { active: false, moved: true, lastX: 0, lastY: 0 };
  beginLegacyPointerDrag(dragState, 12, 7);
  assert.deepEqual(dragState, { active: true, moved: false, lastX: 12, lastY: 7 });
});

test('updateLegacyPointerDrag returns inactive payload when no drag is active', () => {
  const dragState = { active: false, moved: false, lastX: 3, lastY: 4 };
  const result = updateLegacyPointerDrag(
    dragState,
    8,
    10,
    () => true,
    1,
  );
  assert.deepEqual(result, {
    active: false,
    moved: false,
    dx: 0,
    dy: 0,
    clientX: 3,
    clientY: 4,
  });
});

test('updateLegacyPointerDrag applies deltas and movement threshold', () => {
  const dragState = { active: true, moved: false, lastX: 2, lastY: 5 };
  const result = updateLegacyPointerDrag(
    dragState,
    7,
    8,
    (dx, dy, threshold) => Math.abs(dx) + Math.abs(dy) > threshold,
    6,
  );
  assert.deepEqual(result, {
    active: true,
    moved: true,
    dx: 5,
    dy: 3,
    clientX: 7,
    clientY: 8,
  });
  assert.deepEqual(dragState, { active: true, moved: true, lastX: 7, lastY: 8 });
});

test('endLegacyPointerDrag returns completion payload and deactivates state', () => {
  const dragState = { active: true, moved: true, lastX: 20, lastY: 22 };
  const result = endLegacyPointerDrag(dragState);
  assert.deepEqual(result, {
    active: true,
    moved: true,
    clientX: 20,
    clientY: 22,
  });
  assert.equal(dragState.active, false);
});

