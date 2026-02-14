import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildIsometricRendererCameraState,
  buildIsometricRendererDebugStats,
} from '../src/render/isometricRendererSnapshots.js';

test('buildIsometricRendererCameraState normalizes isometric camera payload', () => {
  const renderer = {
    camera: {
      getState: () => ({
        x: 4,
        z: -3,
        zoom: 1.25,
        yaw: 0.5,
        tileWidth: 72,
        tileHeight: 36,
      }),
    },
  };

  const cameraState = buildIsometricRendererCameraState(renderer);
  assert.equal(cameraState.mode, 'isometric');
  assert.equal(cameraState.projection, 'isometric');
  assert.equal(cameraState.tileWidth, 72);
  assert.equal(cameraState.tileHeight, 36);
});

test('buildIsometricRendererDebugStats builds normalized telemetry payload', () => {
  const renderer = {
    smoothedFps: 58.7,
    qualityController: {
      getQuality: () => 0.8,
    },
    particles: {
      particles: [{}, {}, {}],
      maxParticles: 500,
    },
  };

  const stats = buildIsometricRendererDebugStats(renderer);
  assert.equal(stats.mode, 'isometric');
  assert.equal(stats.fps, 58.7);
  assert.equal(stats.quality, 0.8);
  assert.equal(stats.particles, 3);
  assert.equal(stats.particleCap, 500);
});

