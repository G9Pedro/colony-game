import test from 'node:test';
import assert from 'node:assert/strict';
import { formatRenderStatsLabel } from '../src/ui/renderStatsLabel.js';

test('formatRenderStatsLabel returns fallback when stats are unavailable', () => {
  assert.equal(formatRenderStatsLabel(null), 'FPS —');
});

test('formatRenderStatsLabel formats mode, fps, and quality', () => {
  assert.equal(
    formatRenderStatsLabel({ mode: 'three', fps: 59.6, quality: 0.834 }),
    'three · 60fps · q83%',
  );
});

test('formatRenderStatsLabel clamps invalid numeric values', () => {
  assert.equal(
    formatRenderStatsLabel({ mode: 'unknown', fps: -10.1, quality: 2.2 }),
    'isometric · 0fps · q100%',
  );
  assert.equal(
    formatRenderStatsLabel({ mode: 'isometric', fps: Number.NaN, quality: null }),
    'isometric · 0fps · q—',
  );
});

