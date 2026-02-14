import test from 'node:test';
import assert from 'node:assert/strict';
import {
  dispatchIsometricAmbientEffects,
  dispatchIsometricColonistInterpolation,
  dispatchIsometricPlacementAnimationSync,
  dispatchIsometricResourceGainSampling,
} from '../src/render/isometricRuntimeDispatch.js';

function createRendererStub() {
  return {
    knownBuildingIds: new Set(['old']),
    colonistRenderState: new Map(),
  };
}

test('dispatchIsometricPlacementAnimationSync stores known building ids returned by sync', () => {
  const renderer = createRendererStub();
  const state = { buildings: [] };
  const nextIds = new Set(['new-id']);
  const calls = [];

  const result = dispatchIsometricPlacementAnimationSync(renderer, state, 12, {
    runPlacementSync: (target, payload, now) => {
      calls.push({ target, payload, now });
      return nextIds;
    },
  });

  assert.equal(result, nextIds);
  assert.equal(renderer.knownBuildingIds, nextIds);
  assert.deepEqual(calls, [{ target: renderer, payload: state, now: 12 }]);
});

test('dispatchIsometricColonistInterpolation forwards colonists and render state', () => {
  const renderer = createRendererStub();
  const state = { colonists: [{ id: 'c1' }] };
  const calls = [];

  dispatchIsometricColonistInterpolation(renderer, state, 0.3, {
    updateInterpolation: (colonists, renderState, deltaSeconds) => {
      calls.push({ colonists, renderState, deltaSeconds });
    },
  });

  assert.deepEqual(calls, [
    { colonists: state.colonists, renderState: renderer.colonistRenderState, deltaSeconds: 0.3 },
  ]);
});

test('dispatchIsometricResourceGainSampling delegates to sampling runner', () => {
  const renderer = createRendererStub();
  const state = { resources: { wood: 12 } };
  const calls = [];

  dispatchIsometricResourceGainSampling(renderer, state, 0.25, {
    runSampling: (target, payload, deltaSeconds) => {
      calls.push({ target, payload, deltaSeconds });
    },
  });

  assert.deepEqual(calls, [{ target: renderer, payload: state, deltaSeconds: 0.25 }]);
});

test('dispatchIsometricAmbientEffects delegates to ambient effect runner', () => {
  const renderer = createRendererStub();
  const state = { buildings: [{ id: 'hut-1' }] };
  const calls = [];

  dispatchIsometricAmbientEffects(renderer, state, 0.16, {
    runAmbient: (target, payload, deltaSeconds) => {
      calls.push({ target, payload, deltaSeconds });
    },
  });

  assert.deepEqual(calls, [{ target: renderer, payload: state, deltaSeconds: 0.16 }]);
});

