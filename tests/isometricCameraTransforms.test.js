import test from 'node:test';
import assert from 'node:assert/strict';
import {
  captureIsometricCameraState,
  centerIsometricCameraOn,
  mapScreenPointToTile,
  mapWorldPointToTile,
  panIsometricCameraByScreenDelta,
  projectIsometricCameraWorldPoint,
  unprojectIsometricCameraScreenPoint,
  updateIsometricCameraInertia,
  zoomIsometricCameraAtScreenPoint,
} from '../src/render/isometricCameraTransforms.js';

function createCamera() {
  return {
    centerX: 3,
    centerZ: -2,
    viewportWidth: 900,
    viewportHeight: 600,
    zoom: 1.2,
    minZoom: 0.6,
    maxZoom: 2,
    tileWidth: 64,
    tileHeight: 32,
    worldRadius: 30,
    velocityX: 0.5,
    velocityZ: -0.2,
    dragging: false,
    pinchState: { active: false },
    clampCount: 0,
    clampCenter() {
      this.clampCount += 1;
    },
  };
}

test('project/unproject camera point helpers map camera state payload', () => {
  const camera = createCamera();
  const screen = projectIsometricCameraWorldPoint(camera, 7, 4, {
    projectPoint: (payload) => {
      assert.equal(payload.x, 7);
      assert.equal(payload.z, 4);
      assert.equal(payload.centerX, 3);
      assert.equal(payload.centerZ, -2);
      assert.equal(payload.width, 900);
      assert.equal(payload.height, 600);
      assert.equal(payload.zoom, 1.2);
      return { x: 101, y: 202 };
    },
  });
  assert.deepEqual(screen, { x: 101, y: 202 });

  const world = unprojectIsometricCameraScreenPoint(camera, 100, 140, {
    unprojectPoint: (payload) => {
      assert.equal(payload.screenX, 100);
      assert.equal(payload.screenY, 140);
      return { x: 4, z: -1 };
    },
  });
  assert.deepEqual(world, { x: 4, z: -1 });
});

test('map tile helpers round world coordinates and convert screen points', () => {
  assert.deepEqual(mapWorldPointToTile(3.6, -1.49), { x: 4, z: -1 });

  const camera = createCamera();
  const tile = mapScreenPointToTile(camera, 200, 250, {
    screenToWorld: (x, y) => {
      assert.equal(x, 200);
      assert.equal(y, 250);
      return { x: 8.2, z: -4.8 };
    },
  });
  assert.deepEqual(tile, { x: 8, z: -5 });
});

test('panIsometricCameraByScreenDelta applies world delta and clamps', () => {
  const camera = createCamera();
  panIsometricCameraByScreenDelta(camera, 20, -12, {
    computeWorldDelta: ({ deltaX, deltaY, zoom }) => {
      assert.equal(deltaX, 20);
      assert.equal(deltaY, -12);
      assert.equal(zoom, 1.2);
      return { worldDeltaX: 2.5, worldDeltaZ: -1.5 };
    },
  });
  assert.equal(camera.centerX, 0.5);
  assert.equal(camera.centerZ, -0.5);
  assert.equal(camera.clampCount, 1);

  panIsometricCameraByScreenDelta(camera, 1, 1, {
    computeWorldDelta: () => null,
  });
  assert.equal(camera.clampCount, 1);
});

test('zoomIsometricCameraAtScreenPoint updates zoom and keeps cursor anchored', () => {
  const camera = createCamera();
  camera.zoom = 1;
  const before = { x: 10, z: -3 };
  const after = { x: 9.5, z: -2.2 };
  zoomIsometricCameraAtScreenPoint(camera, {
    delta: 0.2,
    screenX: 300,
    screenY: 250,
  }, {
    computeZoomStep: ({ zoom, delta }) => {
      assert.equal(zoom, 1);
      assert.equal(delta, 0.2);
      return 0.8;
    },
    screenToWorld: () => (camera.zoom === 1 ? before : after),
  });

  assert.equal(camera.zoom, 0.8);
  assert.ok(Math.abs(camera.centerX - 3.5) < 0.0000001);
  assert.ok(Math.abs(camera.centerZ - (-2.8)) < 0.0000001);
  assert.equal(camera.clampCount, 1);
});

test('updateIsometricCameraInertia skips while dragging or pinching', () => {
  const camera = createCamera();
  camera.dragging = true;
  updateIsometricCameraInertia(camera, 0.2, {
    applyInertia: () => {
      throw new Error('should skip inertia while dragging');
    },
  });

  camera.dragging = false;
  camera.pinchState.active = true;
  updateIsometricCameraInertia(camera, 0.2, {
    applyInertia: () => {
      throw new Error('should skip inertia while pinching');
    },
  });
});

test('updateIsometricCameraInertia applies returned center and velocity then clamps', () => {
  const camera = createCamera();
  updateIsometricCameraInertia(camera, 0.25, {
    applyInertia: (payload) => {
      assert.equal(payload.centerX, 3);
      assert.equal(payload.centerZ, -2);
      assert.equal(payload.velocityX, 0.5);
      assert.equal(payload.velocityZ, -0.2);
      assert.equal(payload.deltaSeconds, 0.25);
      return {
        centerX: 4,
        centerZ: -1.5,
        velocityX: 0.3,
        velocityZ: -0.1,
      };
    },
  });
  assert.equal(camera.centerX, 4);
  assert.equal(camera.centerZ, -1.5);
  assert.equal(camera.velocityX, 0.3);
  assert.equal(camera.velocityZ, -0.1);
  assert.equal(camera.clampCount, 1);
});

test('center/capture camera helpers mutate and snapshot state', () => {
  const camera = createCamera();
  centerIsometricCameraOn(camera, 12, 14);
  assert.equal(camera.centerX, 12);
  assert.equal(camera.centerZ, 14);
  assert.equal(camera.velocityX, 0);
  assert.equal(camera.velocityZ, 0);
  assert.equal(camera.clampCount, 1);

  assert.deepEqual(captureIsometricCameraState(camera), {
    centerX: 12,
    centerZ: 14,
    zoom: 1.2,
    tileWidth: 64,
    tileHeight: 32,
    width: 900,
    height: 600,
    worldRadius: 30,
  });
});
