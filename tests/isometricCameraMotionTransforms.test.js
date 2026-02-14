import test from 'node:test';
import assert from 'node:assert/strict';
import {
  centerIsometricCameraOn,
  panIsometricCameraByScreenDelta,
  updateIsometricCameraInertia,
  zoomIsometricCameraAtScreenPoint,
} from '../src/render/isometricCameraMotionTransforms.js';

function createCamera() {
  return {
    centerX: 3,
    centerZ: -2,
    zoom: 1,
    minZoom: 0.5,
    maxZoom: 2,
    tileWidth: 64,
    tileHeight: 32,
    velocityX: 0.4,
    velocityZ: -0.2,
    dragging: false,
    pinchState: { active: false },
    clampCount: 0,
    clampCenter() {
      this.clampCount += 1;
    },
  };
}

test('pan helper applies delta and clamps when world delta exists', () => {
  const camera = createCamera();
  panIsometricCameraByScreenDelta(camera, 16, -8, {
    computeWorldDelta: () => ({ worldDeltaX: 2, worldDeltaZ: -1 }),
  });
  assert.equal(camera.centerX, 1);
  assert.equal(camera.centerZ, -1);
  assert.equal(camera.clampCount, 1);
});

test('zoom helper updates zoom and camera center around cursor anchor', () => {
  const camera = createCamera();
  const before = { x: 10, z: 4 };
  const after = { x: 9, z: 3.5 };
  zoomIsometricCameraAtScreenPoint(camera, {
    delta: 0.2,
    screenX: 200,
    screenY: 120,
  }, {
    computeZoomStep: () => 0.8,
    screenToWorld: () => (camera.zoom === 1 ? before : after),
  });
  assert.equal(camera.zoom, 0.8);
  assert.equal(camera.centerX, 4);
  assert.equal(camera.centerZ, -1.5);
  assert.equal(camera.clampCount, 1);
});

test('inertia and center helpers apply runtime updates and clamp once', () => {
  const camera = createCamera();
  updateIsometricCameraInertia(camera, 0.25, {
    applyInertia: () => ({
      centerX: 3.2,
      centerZ: -1.8,
      velocityX: 0.2,
      velocityZ: -0.1,
    }),
  });
  assert.equal(camera.centerX, 3.2);
  assert.equal(camera.centerZ, -1.8);
  assert.equal(camera.velocityX, 0.2);
  assert.equal(camera.velocityZ, -0.1);
  assert.equal(camera.clampCount, 1);

  centerIsometricCameraOn(camera, 7, 9);
  assert.equal(camera.centerX, 7);
  assert.equal(camera.centerZ, 9);
  assert.equal(camera.velocityX, 0);
  assert.equal(camera.velocityZ, 0);
  assert.equal(camera.clampCount, 2);
});
