import test from 'node:test';
import assert from 'node:assert/strict';
import { buildIsometricFrameContext } from '../src/render/isometricFrameContext.js';

test('buildIsometricFrameContext computes frame timing and viewport payload', () => {
  const context = buildIsometricFrameContext({
    now: 2200,
    lastFrameAt: 2100,
    smoothedFps: 58,
    state: { timeSeconds: 360 },
    camera: { viewportWidth: 1280, viewportHeight: 720 },
    computeFrameDeltaSeconds: (now, lastFrameAt, maxDeltaSeconds) => {
      assert.equal(now, 2200);
      assert.equal(lastFrameAt, 2100);
      assert.equal(maxDeltaSeconds, 0.12);
      return 0.1;
    },
    updateSmoothedFps: (smoothedFps, deltaSeconds, fpsSmoothing) => {
      assert.equal(smoothedFps, 58);
      assert.equal(deltaSeconds, 0.1);
      assert.equal(fpsSmoothing, 0.9);
      return 59.5;
    },
    getDaylightFactor: (timeSeconds) => {
      assert.equal(timeSeconds, 360);
      return 0.62;
    },
  });

  assert.deepEqual(context, {
    now: 2200,
    deltaSeconds: 0.1,
    nextLastFrameAt: 2200,
    nextSmoothedFps: 59.5,
    width: 1280,
    height: 720,
    daylight: 0.62,
  });
});

test('buildIsometricFrameContext honors custom max delta and fps smoothing', () => {
  const context = buildIsometricFrameContext({
    now: 50,
    lastFrameAt: 40,
    smoothedFps: 60,
    state: { timeSeconds: 0 },
    camera: { viewportWidth: 800, viewportHeight: 600 },
    computeFrameDeltaSeconds: (_now, _lastFrameAt, maxDeltaSeconds) => maxDeltaSeconds,
    updateSmoothedFps: (_smoothedFps, _deltaSeconds, fpsSmoothing) => fpsSmoothing,
    getDaylightFactor: () => 1,
    maxDeltaSeconds: 0.2,
    fpsSmoothing: 0.75,
  });

  assert.equal(context.deltaSeconds, 0.2);
  assert.equal(context.nextSmoothedFps, 0.75);
});

