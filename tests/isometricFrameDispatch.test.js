import test from 'node:test';
import assert from 'node:assert/strict';
import { dispatchIsometricFrame } from '../src/render/isometricFrameDispatch.js';

test('dispatchIsometricFrame builds invocation, runs frame, and applies frame state', () => {
  const renderer = { id: 'renderer' };
  const state = { id: 'state' };
  const frameResult = { nextLastFrameAt: 22, nextSmoothedFps: 60 };
  const calls = [];

  dispatchIsometricFrame(renderer, state, {
    performanceObject: { now: () => 999 },
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
        now: 999,
      },
    },
    { method: 'runFrame', invocation: { id: 'invocation' } },
    { method: 'applyFrameState', nextRenderer: renderer, frame: frameResult },
  ]);
  assert.equal(renderer.lastState, state);
});

