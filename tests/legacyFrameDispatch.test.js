import test from 'node:test';
import assert from 'node:assert/strict';
import { dispatchLegacyFrame } from '../src/render/legacyFrameDispatch.js';

test('dispatchLegacyFrame builds invocation, runs frame, and applies frame state', () => {
  const renderer = { id: 'renderer' };
  const state = { id: 'state' };
  const calls = [];
  const frameResult = { nextLastFrameAt: 11, nextSmoothedFps: 58 };

  dispatchLegacyFrame(renderer, state, {
    performanceObject: {
      now: () => 12345,
    },
    buildInvocation: (payload) => {
      calls.push({ method: 'buildInvocation', payload });
      return { id: 'invocation' };
    },
    runFrame: (invocation) => {
      calls.push({ method: 'runFrame', invocation });
      return frameResult;
    },
    applyFrameState: (nextRenderer, frame) => {
      calls.push({ method: 'applyFrameState', nextRenderer, frame });
    },
  });

  assert.deepEqual(calls, [
    {
      method: 'buildInvocation',
      payload: {
        renderer,
        state,
        now: 12345,
      },
    },
    { method: 'runFrame', invocation: { id: 'invocation' } },
    { method: 'applyFrameState', nextRenderer: renderer, frame: frameResult },
  ]);
});

