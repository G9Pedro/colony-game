import test from 'node:test';
import assert from 'node:assert/strict';
import {
  captureIsometricCameraState,
  mapScreenPointToTile,
  mapWorldPointToTile,
  projectIsometricCameraWorldPoint,
  unprojectIsometricCameraScreenPoint,
} from '../src/render/isometricCameraCoordinateTransforms.js';

function createCamera() {
  return {
    centerX: 2,
    centerZ: -1,
    viewportWidth: 640,
    viewportHeight: 360,
    zoom: 1.4,
    tileWidth: 64,
    tileHeight: 32,
    worldRadius: 24,
  };
}

test('coordinate transforms map camera payload for project/unproject helpers', () => {
  const camera = createCamera();
  const projected = projectIsometricCameraWorldPoint(camera, 5, 7, {
    projectPoint: (payload) => {
      assert.equal(payload.x, 5);
      assert.equal(payload.z, 7);
      assert.equal(payload.centerX, 2);
      assert.equal(payload.centerZ, -1);
      return { x: 300, y: 220 };
    },
  });
  assert.deepEqual(projected, { x: 300, y: 220 });

  const unprojected = unprojectIsometricCameraScreenPoint(camera, 300, 220, {
    unprojectPoint: (payload) => {
      assert.equal(payload.screenX, 300);
      assert.equal(payload.screenY, 220);
      return { x: 5, z: 7 };
    },
  });
  assert.deepEqual(unprojected, { x: 5, z: 7 });
});

test('tile mapping and camera state snapshot helpers remain deterministic', () => {
  const camera = createCamera();
  assert.deepEqual(mapWorldPointToTile(4.6, -2.2), { x: 5, z: -2 });
  assert.deepEqual(mapScreenPointToTile(camera, 100, 200, {
    screenToWorld: (x, y) => ({ x: x / 10, z: y / 50 }),
  }), { x: 10, z: 4 });
  assert.deepEqual(captureIsometricCameraState(camera), {
    centerX: 2,
    centerZ: -1,
    zoom: 1.4,
    tileWidth: 64,
    tileHeight: 32,
    width: 640,
    height: 360,
    worldRadius: 24,
  });
});
