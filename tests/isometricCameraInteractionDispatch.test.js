import test from 'node:test';
import assert from 'node:assert/strict';
import {
  dispatchIsometricCameraDragEnd,
  dispatchIsometricCameraDragMove,
  dispatchIsometricCameraDragStart,
  dispatchIsometricCameraPinchBegin,
  dispatchIsometricCameraPinchEnd,
  dispatchIsometricCameraPinchMove,
} from '../src/render/isometricCameraInteractionDispatch.js';

function createCameraFixture() {
  return {
    centerX: 0,
    centerZ: 0,
    zoom: 1,
    tileWidth: 64,
    tileHeight: 32,
    dragging: false,
    dragLastX: 0,
    dragLastY: 0,
    lastDragAt: 0,
    dragDistance: 0,
    velocityX: 0,
    velocityZ: 0,
    pinchState: {
      active: false,
      distance: 0,
      midpointX: 0,
      midpointY: 0,
    },
    panByScreenDelta(deltaX, deltaY) {
      this.centerX += deltaX * 0.1;
      this.centerZ += deltaY * 0.1;
    },
    zoomCalls: [],
    zoomAt(delta, x, y) {
      this.zoomCalls.push({ delta, x, y });
    },
  };
}

test('dispatchIsometricCameraDragStart initializes drag runtime state', () => {
  const camera = createCameraFixture();
  camera.velocityX = 3;
  camera.velocityZ = -2;
  dispatchIsometricCameraDragStart(camera, {
    screenX: 120,
    screenY: 80,
    now: 910,
  });

  assert.equal(camera.dragging, true);
  assert.equal(camera.dragLastX, 120);
  assert.equal(camera.dragLastY, 80);
  assert.equal(camera.lastDragAt, 910);
  assert.equal(camera.dragDistance, 0);
  assert.equal(camera.velocityX, 0);
  assert.equal(camera.velocityZ, 0);
});

test('dispatchIsometricCameraDragMove updates pan, distance, velocity, and drag anchors', () => {
  const camera = createCameraFixture();
  camera.dragging = true;
  camera.dragLastX = 20;
  camera.dragLastY = 10;
  camera.lastDragAt = 100;

  dispatchIsometricCameraDragMove(camera, {
    screenX: 52,
    screenY: 26,
    now: 180,
  }, {
    computeVelocity: ({ deltaX, deltaY, elapsedMilliseconds }) => {
      assert.equal(deltaX, 32);
      assert.equal(deltaY, 16);
      assert.equal(elapsedMilliseconds, 80);
      return {
        velocityX: -1.25,
        velocityZ: 0.5,
      };
    },
    didCenterMove: () => true,
  });

  assert.ok(Math.abs(camera.dragDistance - Math.hypot(32, 16)) < 0.0000001);
  assert.equal(camera.centerX, 3.2);
  assert.equal(camera.centerZ, 1.6);
  assert.equal(camera.velocityX, -1.25);
  assert.equal(camera.velocityZ, 0.5);
  assert.equal(camera.dragLastX, 52);
  assert.equal(camera.dragLastY, 26);
  assert.equal(camera.lastDragAt, 180);
});

test('dispatchIsometricCameraDragMove no-ops when camera is not dragging', () => {
  const camera = createCameraFixture();
  dispatchIsometricCameraDragMove(camera, {
    screenX: 80,
    screenY: 20,
    now: 200,
  }, {
    computeVelocity: () => {
      throw new Error('should not compute velocity when not dragging');
    },
  });
  assert.equal(camera.centerX, 0);
  assert.equal(camera.centerZ, 0);
  assert.equal(camera.dragDistance, 0);
});

test('dispatchIsometricCameraDragMove clears velocity when center did not move', () => {
  const camera = createCameraFixture();
  camera.dragging = true;
  camera.dragLastX = 0;
  camera.dragLastY = 0;
  camera.lastDragAt = 10;
  camera.panByScreenDelta = () => {};

  dispatchIsometricCameraDragMove(camera, {
    screenX: 10,
    screenY: 12,
    now: 40,
  }, {
    computeVelocity: () => ({
      velocityX: 4,
      velocityZ: -3,
    }),
    didCenterMove: () => false,
  });

  assert.equal(camera.velocityX, 0);
  assert.equal(camera.velocityZ, 0);
});

test('dispatchIsometricCameraDragEnd uses click policy and disables dragging', () => {
  const camera = createCameraFixture();
  camera.dragging = true;
  camera.dragDistance = 4.5;
  const result = dispatchIsometricCameraDragEnd(camera, {
    isClick: (distance) => {
      assert.equal(distance, 4.5);
      return false;
    },
  });
  assert.deepEqual(result, { wasClick: false });
  assert.equal(camera.dragging, false);
});

test('pinch dispatch helpers update pinch runtime and invoke zoomAt', () => {
  const camera = createCameraFixture();
  camera.velocityX = 1;
  camera.velocityZ = -1;
  dispatchIsometricCameraPinchBegin(camera, { clientX: 0, clientY: 0 }, { clientX: 8, clientY: 6 }, {
    buildPinchState: () => ({
      distance: 10,
      midpointX: 4,
      midpointY: 3,
    }),
  });
  assert.equal(camera.pinchState.active, true);
  assert.equal(camera.pinchState.distance, 10);
  assert.equal(camera.pinchState.midpointX, 4);
  assert.equal(camera.pinchState.midpointY, 3);
  assert.equal(camera.velocityX, 0);
  assert.equal(camera.velocityZ, 0);

  dispatchIsometricCameraPinchMove(camera, { clientX: 0, clientY: 0 }, { clientX: 6, clientY: 8 }, {
    buildPinchState: () => ({
      distance: 8,
      midpointX: 3,
      midpointY: 4,
    }),
  });
  assert.equal(camera.zoomCalls.length, 1);
  assert.ok(Math.abs(camera.zoomCalls[0].delta - 0.0044) < 0.0000001);
  assert.equal(camera.zoomCalls[0].x, 3);
  assert.equal(camera.zoomCalls[0].y, 4);
  assert.equal(camera.pinchState.distance, 8);
  assert.equal(camera.pinchState.midpointX, 3);
  assert.equal(camera.pinchState.midpointY, 4);

  dispatchIsometricCameraPinchEnd(camera);
  assert.equal(camera.pinchState.active, false);
});

test('dispatchIsometricCameraPinchMove ignores inactive or zero-distance gestures', () => {
  const camera = createCameraFixture();
  dispatchIsometricCameraPinchMove(camera, {}, {}, {
    buildPinchState: () => {
      throw new Error('should not run while pinch inactive');
    },
  });
  assert.equal(camera.zoomCalls.length, 0);

  camera.pinchState.active = true;
  dispatchIsometricCameraPinchMove(camera, {}, {}, {
    buildPinchState: () => ({
      distance: 0,
      midpointX: 20,
      midpointY: 24,
    }),
  });
  assert.equal(camera.zoomCalls.length, 0);
});
