import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLegacyCameraState, buildLegacyDebugStats } from '../src/render/legacyRendererSnapshots.js';

test('buildLegacyCameraState composes normalized perspective camera state', () => {
  const state = buildLegacyCameraState({
    rootElement: { clientWidth: 960, clientHeight: 540 },
    cameraTarget: { x: 8, z: -3 },
    worldRadius: 45,
  });

  assert.deepEqual(state, {
    mode: 'three',
    projection: 'perspective',
    centerX: 8,
    centerZ: -3,
    zoom: 1,
    width: 960,
    height: 540,
    worldRadius: 45,
    tileWidth: null,
    tileHeight: null,
  });
});

test('buildLegacyDebugStats returns normalized legacy debug payload', () => {
  const stats = buildLegacyDebugStats(57.8);
  assert.deepEqual(stats, {
    mode: 'three',
    fps: 57.8,
    quality: 1,
    particles: 0,
    particleCap: 0,
  });
});

