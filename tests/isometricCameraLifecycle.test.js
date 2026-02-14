import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clampIsometricCameraCenter,
  setIsometricCameraViewport,
  setIsometricCameraWorldRadius,
} from '../src/render/isometricCameraLifecycle.js';

test('setIsometricCameraViewport clamps viewport dimensions to minimum one pixel', () => {
  const camera = {};
  setIsometricCameraViewport(camera, 0, -40);
  assert.equal(camera.viewportWidth, 1);
  assert.equal(camera.viewportHeight, 1);
});

test('clampIsometricCameraCenter applies injected clamp function output', () => {
  const camera = {
    centerX: 12,
    centerZ: -9,
    worldRadius: 30,
  };
  clampIsometricCameraCenter(camera, {
    clampCenter: (centerX, centerZ, options) => {
      assert.equal(centerX, 12);
      assert.equal(centerZ, -9);
      assert.equal(options.worldRadius, 30);
      return { centerX: 4, centerZ: -3 };
    },
  });
  assert.equal(camera.centerX, 4);
  assert.equal(camera.centerZ, -3);
});

test('setIsometricCameraWorldRadius clamps radius and re-clamps center', () => {
  const camera = {
    centerX: 8,
    centerZ: -6,
    worldRadius: 12,
  };
  const calls = [];
  setIsometricCameraWorldRadius(camera, 2, {
    minimumWorldRadius: 4,
    clampCenter: (centerX, centerZ, options) => {
      calls.push({ centerX, centerZ, worldRadius: options.worldRadius });
      return { centerX: 3, centerZ: -2 };
    },
  });
  assert.equal(camera.worldRadius, 4);
  assert.equal(camera.centerX, 3);
  assert.equal(camera.centerZ, -2);
  assert.deepEqual(calls, [{
    centerX: 8,
    centerZ: -6,
    worldRadius: 4,
  }]);
});
