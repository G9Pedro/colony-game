import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLegacyFrameContext } from '../src/render/legacyFrameContext.js';

test('buildLegacyFrameContext computes frame delta and smoothed fps', () => {
  const frame = buildLegacyFrameContext({
    now: 1500,
    lastFrameAt: 1400,
    smoothedFps: 55,
    computeFrameDeltaSeconds: (now, lastFrameAt, maxDeltaSeconds) => {
      assert.equal(now, 1500);
      assert.equal(lastFrameAt, 1400);
      assert.equal(maxDeltaSeconds, 0.2);
      return 0.08;
    },
    updateSmoothedFps: (smoothedFps, deltaSeconds, fpsSmoothing) => {
      assert.equal(smoothedFps, 55);
      assert.equal(deltaSeconds, 0.08);
      assert.equal(fpsSmoothing, 0.9);
      return 57.25;
    },
  });

  assert.deepEqual(frame, {
    now: 1500,
    deltaSeconds: 0.08,
    nextLastFrameAt: 1500,
    nextSmoothedFps: 57.25,
  });
});

test('buildLegacyFrameContext supports custom timing parameters', () => {
  const frame = buildLegacyFrameContext({
    now: 90,
    lastFrameAt: 0,
    smoothedFps: 60,
    computeFrameDeltaSeconds: (_now, _lastFrameAt, maxDeltaSeconds) => maxDeltaSeconds,
    updateSmoothedFps: (_smoothedFps, _deltaSeconds, fpsSmoothing) => fpsSmoothing,
    maxDeltaSeconds: 0.5,
    fpsSmoothing: 0.6,
  });

  assert.equal(frame.deltaSeconds, 0.5);
  assert.equal(frame.nextSmoothedFps, 0.6);
});

