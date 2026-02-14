import test from 'node:test';
import assert from 'node:assert/strict';
import { applyRendererFrameState } from '../src/render/rendererFrameState.js';

test('applyRendererFrameState stores next frame counters on renderer', () => {
  const renderer = {
    lastFrameAt: 10,
    smoothedFps: 60,
  };

  applyRendererFrameState(renderer, {
    nextLastFrameAt: 25,
    nextSmoothedFps: 58.5,
  });

  assert.equal(renderer.lastFrameAt, 25);
  assert.equal(renderer.smoothedFps, 58.5);
});

