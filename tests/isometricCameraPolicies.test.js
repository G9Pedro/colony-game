import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeCameraVelocityFromScreenDelta,
  computeCameraZoomStep,
  didCameraCenterMove,
  isDragClick,
} from '../src/render/isometricCameraPolicies.js';

test('computeCameraZoomStep clamps zoom to configured bounds', () => {
  assert.equal(computeCameraZoomStep({
    zoom: 1,
    delta: 5,
    minZoom: 0.6,
    maxZoom: 2,
  }), 0.6);
  assert.equal(computeCameraZoomStep({
    zoom: 1,
    delta: -5,
    minZoom: 0.6,
    maxZoom: 2,
  }), 2);
  assert.equal(computeCameraZoomStep({
    zoom: 1.2,
    delta: 0.1,
    minZoom: 0.6,
    maxZoom: 2,
  }), 1.08);
});

test('computeCameraVelocityFromScreenDelta converts drag deltas into world velocity', () => {
  const velocity = computeCameraVelocityFromScreenDelta({
    deltaX: 32,
    deltaY: 16,
    elapsedMilliseconds: 1000,
    zoom: 1,
    tileWidth: 64,
    tileHeight: 32,
  });
  assert.deepEqual(velocity, {
    velocityX: -1,
    velocityZ: -0,
  });
});

test('computeCameraVelocityFromScreenDelta returns zero velocity for invalid scale', () => {
  assert.deepEqual(computeCameraVelocityFromScreenDelta({
    deltaX: 32,
    deltaY: 16,
    elapsedMilliseconds: 1000,
    zoom: 0,
    tileWidth: 64,
    tileHeight: 32,
  }), {
    velocityX: 0,
    velocityZ: 0,
  });
});

test('didCameraCenterMove and isDragClick apply movement thresholds', () => {
  assert.equal(didCameraCenterMove(
    { centerX: 1, centerZ: 2 },
    { centerX: 1.00005, centerZ: 2.00005 },
  ), false);
  assert.equal(didCameraCenterMove(
    { centerX: 1, centerZ: 2 },
    { centerX: 1.001, centerZ: 2 },
  ), true);
  assert.equal(isDragClick(4.99), true);
  assert.equal(isDragClick(5), false);
});

