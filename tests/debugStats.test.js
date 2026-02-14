import test from 'node:test';
import assert from 'node:assert/strict';
import { createDebugStats, normalizeDebugStats, normalizeRendererMode } from '../src/render/debugStats.js';

test('normalizeRendererMode accepts supported modes and falls back safely', () => {
  assert.equal(normalizeRendererMode('isometric'), 'isometric');
  assert.equal(normalizeRendererMode('three'), 'three');
  assert.equal(normalizeRendererMode('unexpected'), 'isometric');
  assert.equal(normalizeRendererMode('unexpected', 'three'), 'three');
});

test('normalizeDebugStats returns safe defaults for missing payloads', () => {
  assert.deepEqual(normalizeDebugStats(null), {
    mode: 'isometric',
    fps: 0,
    quality: null,
    particles: 0,
    particleCap: 0,
  });
});

test('createDebugStats clamps and normalizes schema fields', () => {
  const stats = createDebugStats({
    mode: 'unexpected-mode',
    fps: Number.NaN,
    quality: 1.5,
    particles: -2.2,
    particleCap: 16.9,
  });

  assert.deepEqual(stats, {
    mode: 'isometric',
    fps: 0,
    quality: 1,
    particles: 0,
    particleCap: 17,
  });
});

