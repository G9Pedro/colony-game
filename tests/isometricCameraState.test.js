import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyCameraInertia,
  buildPinchGestureState,
  clampCameraCenter,
} from '../src/render/isometricCameraState.js';

test('clampCameraCenter constrains center coordinates using world radius and margin', () => {
  assert.deepEqual(clampCameraCenter(40, -50, {
    worldRadius: 10,
    panMargin: 2,
  }), {
    centerX: 12,
    centerZ: -12,
  });
});

test('applyCameraInertia advances center and damps velocity', () => {
  const next = applyCameraInertia({
    centerX: 2,
    centerZ: -3,
    velocityX: 4,
    velocityZ: -2,
    deltaSeconds: 0.5,
    dragDamping: 1,
    minimumVelocity: 0.01,
  });

  assert.deepEqual(next, {
    centerX: 4,
    centerZ: -4,
    velocityX: 2,
    velocityZ: -1,
  });
});

test('applyCameraInertia zeroes velocities below threshold', () => {
  const next = applyCameraInertia({
    centerX: 0,
    centerZ: 0,
    velocityX: 0.02,
    velocityZ: -0.02,
    deltaSeconds: 1,
    dragDamping: 0.5,
    minimumVelocity: 0.02,
  });

  assert.equal(next.velocityX, 0);
  assert.equal(next.velocityZ, 0);
});

test('buildPinchGestureState computes pinch distance and midpoint', () => {
  assert.deepEqual(buildPinchGestureState(
    { clientX: 10, clientY: 20 },
    { clientX: 34, clientY: 52 },
  ), {
    distance: 40,
    midpointX: 22,
    midpointY: 36,
  });
});

