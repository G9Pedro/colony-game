import test from 'node:test';
import assert from 'node:assert/strict';
import {
  runIsometricAmbientEffects,
  runIsometricPlacementEffectSync,
  runIsometricResourceGainSampling,
} from '../src/render/isometricEffectDispatch.js';

test('runIsometricPlacementEffectSync builds invocation and returns sync result', () => {
  const renderer = { id: 'renderer' };
  const state = { id: 'state' };
  const now = 42;
  const calls = [];

  const result = runIsometricPlacementEffectSync(renderer, state, now, {
    buildInvocation: (nextRenderer, nextState, nextNow) => {
      calls.push({ method: 'buildInvocation', nextRenderer, nextState, nextNow });
      return { payload: 'placement' };
    },
    syncEffects: (invocation) => {
      calls.push({ method: 'syncEffects', invocation });
      return new Set(['a', 'b']);
    },
  });

  assert.deepEqual(calls, [
    { method: 'buildInvocation', nextRenderer: renderer, nextState: state, nextNow: now },
    { method: 'syncEffects', invocation: { payload: 'placement' } },
  ]);
  assert.deepEqual([...result], ['a', 'b']);
});

test('runIsometricResourceGainSampling samples tracker and emits floating text', () => {
  const renderer = {
    resourceGainTracker: {
      sample: (resources, deltaSeconds) => ({ resources, deltaSeconds, gain: 3 }),
    },
  };
  const state = { resources: { wood: 10 } };
  const calls = [];

  runIsometricResourceGainSampling(renderer, state, 0.5, {
    buildInvocation: (nextRenderer, gains, nextState) => {
      calls.push({ method: 'buildInvocation', nextRenderer, gains, nextState });
      return { payload: 'resource' };
    },
    emitFloatingText: (invocation) => {
      calls.push({ method: 'emitFloatingText', invocation });
    },
  });

  assert.deepEqual(calls, [
    {
      method: 'buildInvocation',
      nextRenderer: renderer,
      gains: { resources: { wood: 10 }, deltaSeconds: 0.5, gain: 3 },
      nextState: state,
    },
    { method: 'emitFloatingText', invocation: { payload: 'resource' } },
  ]);
});

test('runIsometricAmbientEffects builds invocation and emits ambient effects', () => {
  const renderer = { id: 'renderer' };
  const state = { id: 'state' };
  const calls = [];

  runIsometricAmbientEffects(renderer, state, 0.25, {
    buildInvocation: (nextRenderer, nextState, deltaSeconds) => {
      calls.push({ method: 'buildInvocation', nextRenderer, nextState, deltaSeconds });
      return { payload: 'ambient' };
    },
    emitAmbient: (invocation) => {
      calls.push({ method: 'emitAmbient', invocation });
    },
  });

  assert.deepEqual(calls, [
    { method: 'buildInvocation', nextRenderer: renderer, nextState: state, deltaSeconds: 0.25 },
    { method: 'emitAmbient', invocation: { payload: 'ambient' } },
  ]);
});

