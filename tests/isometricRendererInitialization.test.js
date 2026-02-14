import test from 'node:test';
import assert from 'node:assert/strict';
import { initializeIsometricRenderer } from '../src/render/isometricRendererInitialization.js';

test('initializeIsometricRenderer wires runtime, interaction, and resize lifecycle', () => {
  const resizeCalls = [];
  const renderer = {
    resize: () => resizeCalls.push('resize'),
  };
  const rootElement = { id: 'root' };
  const runtime = {
    camera: { zoom: 1 },
    ctx: { fillRect: () => {} },
  };
  const interactionController = { onPointerMove: () => {} };
  const addEventCalls = [];
  const windowObject = {
    addEventListener: (eventName, callback) => addEventCalls.push({ eventName, callback }),
  };

  initializeIsometricRenderer(renderer, {
    rootElement,
    options: { quality: 'low' },
    documentObject: { createElement: () => ({}) },
    performanceObject: { now: () => 120 },
    windowObject,
    createRuntime: (payload) => {
      assert.equal(payload.rootElement, rootElement);
      assert.deepEqual(payload.options, { quality: 'low' });
      return runtime;
    },
    createInteractionSession: ({ renderer: runtimeRenderer }) => {
      assert.equal(runtimeRenderer, renderer);
      return interactionController;
    },
  });

  assert.equal(renderer.rootElement, rootElement);
  assert.equal(renderer.onGroundClick, null);
  assert.equal(renderer.onPlacementPreview, null);
  assert.equal(renderer.onEntitySelect, null);
  assert.equal(renderer.camera, runtime.camera);
  assert.equal(renderer.ctx, runtime.ctx);
  assert.equal(renderer.interactionController, interactionController);

  assert.equal(addEventCalls.length, 1);
  assert.equal(addEventCalls[0].eventName, 'resize');
  assert.equal(typeof renderer.boundResize, 'function');
  assert.equal(addEventCalls[0].callback, renderer.boundResize);

  assert.deepEqual(resizeCalls, ['resize']);
  renderer.boundResize();
  assert.deepEqual(resizeCalls, ['resize', 'resize']);
});

