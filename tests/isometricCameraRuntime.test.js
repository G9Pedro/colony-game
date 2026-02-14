import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createIsometricCameraRuntimeState,
  DEFAULT_TILE_HEIGHT,
  DEFAULT_TILE_WIDTH,
} from '../src/render/isometricCameraRuntime.js';

test('isometric camera runtime constants expose expected tile defaults', () => {
  assert.equal(DEFAULT_TILE_WIDTH, 64);
  assert.equal(DEFAULT_TILE_HEIGHT, 32);
});

test('createIsometricCameraRuntimeState builds zeroed runtime fields', () => {
  assert.deepEqual(createIsometricCameraRuntimeState({
    now: 1234,
  }), {
    viewportWidth: 1,
    viewportHeight: 1,
    centerX: 0,
    centerZ: 0,
    velocityX: 0,
    velocityZ: 0,
    dragging: false,
    dragLastX: 0,
    dragLastY: 0,
    lastDragAt: 1234,
    dragDistance: 0,
    pinchState: {
      active: false,
      distance: 0,
      midpointX: 0,
      midpointY: 0,
    },
  });
});

