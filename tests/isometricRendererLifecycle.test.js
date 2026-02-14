import test from 'node:test';
import assert from 'node:assert/strict';
import { disposeIsometricRenderer, resizeIsometricViewport } from '../src/render/isometricRendererLifecycle.js';

test('resizeIsometricViewport updates canvas dimensions and viewport metadata', () => {
  const canvas = { width: 0, height: 0 };
  const transforms = [];
  const scales = [];
  const ctx = {
    setTransform: (...args) => transforms.push(args),
    scale: (...args) => scales.push(args),
  };
  const viewports = [];
  const terrainResizes = [];

  const viewport = resizeIsometricViewport({
    rootElement: { clientWidth: 1200, clientHeight: 700 },
    canvas,
    ctx,
    camera: {
      setViewport: (width, height) => viewports.push({ width, height }),
    },
    terrainLayer: {
      resize: (width, height, dpr) => terrainResizes.push({ width, height, dpr }),
    },
    windowObject: { devicePixelRatio: 3 },
    maxPixelRatio: 2,
  });

  assert.deepEqual(viewport, { width: 1200, height: 700, dpr: 2 });
  assert.equal(canvas.width, 2400);
  assert.equal(canvas.height, 1400);
  assert.deepEqual(transforms, [[1, 0, 0, 1, 0, 0]]);
  assert.deepEqual(scales, [[2, 2]]);
  assert.deepEqual(viewports, [{ width: 1200, height: 700 }]);
  assert.deepEqual(terrainResizes, [{ width: 1200, height: 700, dpr: 2 }]);
});

test('disposeIsometricRenderer releases listeners and renderer-owned resources', () => {
  const removedEvents = [];
  const interactionCalls = [];
  const canvasCalls = [];
  const clearCalls = [];

  disposeIsometricRenderer({
    windowObject: {
      removeEventListener: (eventName, listener) => removedEvents.push({ eventName, listener }),
    },
    boundResize: 'bound-resize-handler',
    interactionController: {
      dispose: () => interactionCalls.push('dispose'),
    },
    canvas: {
      remove: () => canvasCalls.push('remove'),
    },
    clearInteractiveEntities: () => clearCalls.push('interactive'),
    clearTerrainLayer: () => clearCalls.push('terrain'),
  });

  assert.deepEqual(removedEvents, [
    { eventName: 'resize', listener: 'bound-resize-handler' },
  ]);
  assert.deepEqual(interactionCalls, ['dispose']);
  assert.deepEqual(canvasCalls, ['remove']);
  assert.deepEqual(clearCalls, ['interactive', 'terrain']);
});

