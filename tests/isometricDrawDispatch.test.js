import test from 'node:test';
import assert from 'node:assert/strict';
import {
  dispatchIsometricBackgroundDraw,
  dispatchIsometricEntityDraw,
  dispatchIsometricPreviewDraw,
  dispatchIsometricSelectionDraw,
  dispatchIsometricTerrainDraw,
} from '../src/render/isometricDrawDispatch.js';

function createRendererStub() {
  return {
    ctx: { id: 'ctx' },
    camera: { id: 'camera' },
    preview: { x: 2, z: 3, valid: true },
    devicePixelRatio: 2,
    terrainLayer: {
      draw: (...args) => {
        createRendererStub.terrainCalls.push(args);
      },
    },
  };
}
createRendererStub.terrainCalls = [];

test('dispatchIsometricBackgroundDraw delegates to background painter', () => {
  const renderer = createRendererStub();
  const calls = [];

  dispatchIsometricBackgroundDraw(renderer, 800, 600, 0.75, {
    drawBackground: (...args) => calls.push(args),
  });

  assert.deepEqual(calls, [[renderer.ctx, 800, 600, 0.75]]);
});

test('dispatchIsometricTerrainDraw delegates to terrain layer draw', () => {
  const renderer = createRendererStub();
  createRendererStub.terrainCalls = [];
  const state = { id: 'state' };

  dispatchIsometricTerrainDraw(renderer, state);

  assert.deepEqual(createRendererStub.terrainCalls, [[renderer.ctx, state, renderer.camera, 2]]);
});

test('dispatchIsometricPreviewDraw delegates to preview painter', () => {
  const renderer = createRendererStub();
  const calls = [];

  dispatchIsometricPreviewDraw(renderer, {
    drawPreview: (...args) => calls.push(args),
  });

  assert.deepEqual(calls, [[renderer.ctx, renderer.camera, renderer.preview]]);
});

test('dispatchIsometricSelectionDraw delegates to selection painter', () => {
  const renderer = createRendererStub();
  const entity = { id: 'entity' };
  const calls = [];

  dispatchIsometricSelectionDraw(renderer, entity, 0.4, {
    drawSelection: (...args) => calls.push(args),
  });

  assert.deepEqual(calls, [[renderer.ctx, renderer.camera, entity, 0.4]]);
});

test('dispatchIsometricEntityDraw builds invocation and returns draw result', () => {
  const renderer = createRendererStub();
  const state = { id: 'state' };
  const calls = [];
  const result = dispatchIsometricEntityDraw(renderer, state, 123, 0.9, {
    buildInvocation: (nextRenderer, nextState, now, daylight) => {
      calls.push({ method: 'buildInvocation', nextRenderer, nextState, now, daylight });
      return { payload: 'invocation' };
    },
    drawEntities: (invocation) => {
      calls.push({ method: 'drawEntities', invocation });
      return { interactiveCount: 7 };
    },
  });

  assert.deepEqual(calls, [
    {
      method: 'buildInvocation',
      nextRenderer: renderer,
      nextState: state,
      now: 123,
      daylight: 0.9,
    },
    { method: 'drawEntities', invocation: { payload: 'invocation' } },
  ]);
  assert.deepEqual(result, { interactiveCount: 7 });
});

