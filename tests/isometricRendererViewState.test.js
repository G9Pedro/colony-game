import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildIsometricCameraStatePayload,
  buildIsometricDebugStatsPayload,
} from '../src/render/isometricRendererViewState.js';

test('buildIsometricCameraStatePayload augments camera payload with mode metadata', () => {
  const payload = buildIsometricCameraStatePayload({
    centerX: 10,
    centerZ: -2,
    zoom: 1.2,
  });

  assert.deepEqual(payload, {
    centerX: 10,
    centerZ: -2,
    zoom: 1.2,
    mode: 'isometric',
    projection: 'isometric',
  });
});

test('buildIsometricDebugStatsPayload maps rendering metrics to debug schema', () => {
  const payload = buildIsometricDebugStatsPayload({
    smoothedFps: 58.3,
    quality: 'balanced',
    particleCount: 120,
    particleCap: 520,
  });

  assert.deepEqual(payload, {
    mode: 'isometric',
    fps: 58.3,
    quality: 'balanced',
    particles: 120,
    particleCap: 520,
  });
});

