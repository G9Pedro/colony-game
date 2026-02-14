import test from 'node:test';
import assert from 'node:assert/strict';
import { computeFrameDeltaSeconds, updateSmoothedFps } from '../src/render/frameTiming.js';

test('computeFrameDeltaSeconds clamps negative and oversized values', () => {
  assert.equal(computeFrameDeltaSeconds(1000, 1000, 0.12), 0);
  assert.equal(computeFrameDeltaSeconds(900, 1000, 0.12), 0);
  assert.equal(computeFrameDeltaSeconds(2000, 1000, 0.12), 0.12);
  assert.equal(computeFrameDeltaSeconds(1050, 1000, 0.12), 0.05);
});

test('updateSmoothedFps blends instant fps and previous value', () => {
  const next = updateSmoothedFps(60, 0.02, 0.9); // instant fps 50
  assert.ok(next < 60);
  assert.ok(next > 50);
  assert.equal(updateSmoothedFps(60, 0, 0.9), 60);
});

