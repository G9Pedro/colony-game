import test from 'node:test';
import assert from 'node:assert/strict';
import { runLegacyFrame } from '../src/render/legacyFrameRender.js';

test('runLegacyFrame builds frame context and runs scene sync pipeline', () => {
  const calls = [];
  const state = { id: 'state-1' };
  const frame = runLegacyFrame({
    state,
    now: 250,
    lastFrameAt: 200,
    smoothedFps: 58,
    syncBuildings: (nextState) => calls.push({ type: 'buildings', nextState }),
    syncColonists: (nextState) => calls.push({ type: 'colonists', nextState }),
    renderScene: () => calls.push({ type: 'render' }),
    buildFrameContext: ({ now, lastFrameAt, smoothedFps, computeFrameDeltaSeconds, updateSmoothedFps }) => {
      calls.push({
        type: 'context',
        now,
        lastFrameAt,
        smoothedFps,
        hasCompute: typeof computeFrameDeltaSeconds,
        hasUpdate: typeof updateSmoothedFps,
      });
      return {
        now,
        deltaSeconds: 0.05,
        nextLastFrameAt: now,
        nextSmoothedFps: 60,
      };
    },
  });

  assert.deepEqual(frame, {
    now: 250,
    deltaSeconds: 0.05,
    nextLastFrameAt: 250,
    nextSmoothedFps: 60,
  });
  assert.deepEqual(calls, [
    {
      type: 'context',
      now: 250,
      lastFrameAt: 200,
      smoothedFps: 58,
      hasCompute: 'function',
      hasUpdate: 'function',
    },
    { type: 'buildings', nextState: state },
    { type: 'colonists', nextState: state },
    { type: 'render' },
  ]);
});

test('runLegacyFrame forwards custom timing parameters to frame builder', () => {
  const params = [];
  runLegacyFrame({
    state: {},
    now: 100,
    lastFrameAt: 50,
    smoothedFps: 44,
    syncBuildings: () => {},
    syncColonists: () => {},
    renderScene: () => {},
    maxDeltaSeconds: 0.4,
    fpsSmoothing: 0.7,
    computeFrameDeltaSecondsFn: () => 0.1,
    updateSmoothedFpsFn: () => 48,
    buildFrameContext: (payload) => {
      params.push(payload);
      return {
        now: payload.now,
        deltaSeconds: 0.1,
        nextLastFrameAt: payload.now,
        nextSmoothedFps: 48,
      };
    },
  });

  assert.equal(params.length, 1);
  assert.equal(params[0].maxDeltaSeconds, 0.4);
  assert.equal(params[0].fpsSmoothing, 0.7);
});

