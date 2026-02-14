import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createLegacyCameraRig,
  createLegacyInteractionState,
  createLegacyWebGLRenderer,
} from '../src/render/legacyRendererBootstrap.js';

function createThreeMock() {
  class PerspectiveCamera {
    constructor(fov, aspect, near, far) {
      this.fov = fov;
      this.aspect = aspect;
      this.near = near;
      this.far = far;
    }
  }
  class Vector3 {
    constructor(x, y, z) {
      this.x = x;
      this.y = y;
      this.z = z;
    }
  }
  class WebGLRenderer {
    constructor(options) {
      this.options = options;
      this.shadowMap = { enabled: true };
      this.domElement = { id: 'canvas' };
      this.pixelRatio = null;
    }

    setPixelRatio(value) {
      this.pixelRatio = value;
    }
  }
  class Raycaster {}
  class Vector2 {}
  return {
    PerspectiveCamera,
    Vector3,
    WebGLRenderer,
    Raycaster,
    Vector2,
  };
}

test('createLegacyCameraRig builds camera target and polar defaults', () => {
  const three = createThreeMock();
  const rig = createLegacyCameraRig(three);
  assert.equal(rig.camera.fov, 65);
  assert.equal(rig.camera.aspect, 1);
  assert.equal(rig.camera.near, 0.1);
  assert.equal(rig.camera.far, 300);
  assert.equal(rig.cameraTarget.x, 0);
  assert.equal(rig.cameraTarget.y, 0);
  assert.equal(rig.cameraTarget.z, 0);
  assert.deepEqual(rig.cameraPolar, {
    radius: 42,
    yaw: Math.PI / 4,
    pitch: 0.72,
  });
});

test('createLegacyWebGLRenderer configures renderer and appends canvas', () => {
  const three = createThreeMock();
  const appended = [];
  const rootElement = {
    appendChild(node) {
      appended.push(node);
    },
  };

  const renderer = createLegacyWebGLRenderer({
    rootElement,
    three,
    windowObject: { devicePixelRatio: 3 },
    maxPixelRatio: 2,
  });

  assert.deepEqual(renderer.options, { antialias: true });
  assert.equal(renderer.pixelRatio, 2);
  assert.equal(renderer.shadowMap.enabled, false);
  assert.deepEqual(appended, [renderer.domElement]);
});

test('createLegacyInteractionState returns isolated interaction stores', () => {
  const three = createThreeMock();
  const state = createLegacyInteractionState(three);
  assert.equal(state.groundPlane, null);
  assert.equal(state.previewMarker, null);
  assert.deepEqual(state.dragState, {
    active: false,
    moved: false,
    lastX: 0,
    lastY: 0,
  });
  assert.deepEqual(state.touchState, {
    isPinching: false,
    pinchDistance: 0,
  });
  assert.equal(state.buildingMeshes instanceof Map, true);
  assert.equal(state.colonistMeshes instanceof Map, true);
});

