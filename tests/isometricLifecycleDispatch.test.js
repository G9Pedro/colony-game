import test from 'node:test';
import assert from 'node:assert/strict';
import { dispatchIsometricDispose, dispatchIsometricResize } from '../src/render/isometricLifecycleDispatch.js';

test('dispatchIsometricResize maps renderer runtime payload and updates device pixel ratio', () => {
  const renderer = {
    rootElement: { id: 'root' },
    canvas: { id: 'canvas' },
    ctx: { id: 'ctx' },
    camera: { id: 'camera' },
    terrainLayer: { id: 'terrain' },
    devicePixelRatio: 1,
  };
  const calls = [];

  const viewport = dispatchIsometricResize(renderer, {
    windowObject: { id: 'window' },
    maxPixelRatio: 3,
    resizeViewport: (payload) => {
      calls.push(payload);
      return { dpr: 1.5 };
    },
  });

  assert.deepEqual(calls, [{
    rootElement: renderer.rootElement,
    canvas: renderer.canvas,
    ctx: renderer.ctx,
    camera: renderer.camera,
    terrainLayer: renderer.terrainLayer,
    windowObject: { id: 'window' },
    maxPixelRatio: 3,
  }]);
  assert.equal(renderer.devicePixelRatio, 1.5);
  assert.deepEqual(viewport, { dpr: 1.5 });
});

test('dispatchIsometricDispose invokes lifecycle disposal and clears renderer runtime state', () => {
  const renderer = {
    boundResize: () => {},
    interactionController: { id: 'controller' },
    canvas: { id: 'canvas' },
    interactiveEntities: [1, 2],
    terrainLayer: { id: 'terrain' },
  };
  let invocation;

  dispatchIsometricDispose(renderer, {
    windowObject: { id: 'window' },
    disposeRenderer: (payload) => {
      invocation = payload;
      payload.clearInteractiveEntities();
      payload.clearTerrainLayer();
    },
  });

  assert.equal(invocation.windowObject.id, 'window');
  assert.equal(invocation.boundResize, renderer.boundResize);
  assert.deepEqual(invocation.interactionController, { id: 'controller' });
  assert.equal(invocation.canvas, renderer.canvas);
  assert.deepEqual(renderer.interactiveEntities, []);
  assert.equal(renderer.terrainLayer, null);
  assert.equal(renderer.interactionController, null);
});

