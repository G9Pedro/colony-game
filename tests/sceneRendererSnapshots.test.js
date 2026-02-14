import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSceneRendererCameraState, buildSceneRendererDebugStats } from '../src/render/sceneRendererSnapshots.js';

test('buildSceneRendererCameraState normalizes active renderer camera payload by mode', () => {
  const renderer = {
    mode: 'isometric',
    activeRenderer: {
      getCameraState: () => ({
        x: 10,
        z: -4,
        zoom: 1.2,
        tileWidth: 64,
        tileHeight: 32,
      }),
    },
  };
  const cameraState = buildSceneRendererCameraState(renderer);
  assert.equal(cameraState.mode, 'isometric');
  assert.equal(cameraState.projection, 'isometric');
  assert.equal(cameraState.tileWidth, 64);
  assert.equal(cameraState.tileHeight, 32);
});

test('buildSceneRendererDebugStats normalizes active renderer debug payload', () => {
  const renderer = {
    mode: 'three',
    activeRenderer: {
      getDebugStats: () => ({
        fps: 75,
        quality: 'high',
        particles: 99,
        particleCap: 200,
      }),
    },
  };
  const stats = buildSceneRendererDebugStats(renderer);
  assert.equal(stats.mode, 'three');
  assert.equal(stats.fps, 75);
  assert.equal(stats.quality, null);
  assert.equal(stats.particles, 99);
  assert.equal(stats.particleCap, 200);
});

