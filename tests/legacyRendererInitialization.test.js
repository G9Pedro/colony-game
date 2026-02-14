import test from 'node:test';
import assert from 'node:assert/strict';
import { initializeLegacyThreeRenderer } from '../src/render/legacyRendererInitialization.js';

test('initializeLegacyThreeRenderer orchestrates base/runtime setup and lifecycle methods', () => {
  const rootElement = { id: 'root' };
  const three = { Vector2: class {} };
  const callOrder = [];
  const renderer = {
    updateCamera: () => callOrder.push('updateCamera'),
    resize: () => callOrder.push('resize'),
    bindEvents: () => callOrder.push('bindEvents'),
  };
  const runtime = { camera: { zoom: 1 } };

  initializeLegacyThreeRenderer(renderer, {
    rootElement,
    three,
    performanceObject: { now: () => 8 },
    windowObject: { devicePixelRatio: 1 },
    maxPixelRatio: 3,
    createBaseState: (payload) => {
      callOrder.push('createBaseState');
      assert.equal(payload.rootElement, rootElement);
      assert.equal(payload.three, three);
      return { scene: { id: 'scene' } };
    },
    createRuntime: (payload) => {
      callOrder.push('createRuntime');
      assert.equal(payload.rootElement, rootElement);
      assert.equal(payload.scene.id, 'scene');
      assert.equal(payload.three, three);
      assert.equal(payload.maxPixelRatio, 3);
      return runtime;
    },
    applyRuntimeState: (targetRenderer, runtimePayload) => {
      callOrder.push('applyRuntimeState');
      assert.equal(targetRenderer, renderer);
      assert.equal(runtimePayload, runtime);
      targetRenderer.camera = runtimePayload.camera;
    },
  });

  assert.equal(renderer.camera, runtime.camera);
  assert.deepEqual(callOrder, [
    'createBaseState',
    'createRuntime',
    'applyRuntimeState',
    'updateCamera',
    'resize',
    'bindEvents',
  ]);
});

test('initializeLegacyThreeRenderer uses default maxPixelRatio when omitted', () => {
  let observedMaxPixelRatio = null;
  const renderer = {
    updateCamera() {},
    resize() {},
    bindEvents() {},
  };

  initializeLegacyThreeRenderer(renderer, {
    rootElement: {},
    three: {},
    performanceObject: {},
    windowObject: {},
    createBaseState: () => ({ scene: {} }),
    createRuntime: (payload) => {
      observedMaxPixelRatio = payload.maxPixelRatio;
      return {};
    },
    applyRuntimeState: () => {},
  });

  assert.equal(observedMaxPixelRatio, 2);
});

