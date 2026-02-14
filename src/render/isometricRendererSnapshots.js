import { normalizeCameraState } from './cameraState.js';
import { createDebugStats } from './debugStats.js';
import { buildIsometricCameraStatePayload, buildIsometricDebugStatsPayload } from './isometricRendererViewState.js';

export function buildIsometricRendererCameraState(renderer) {
  return normalizeCameraState(buildIsometricCameraStatePayload(renderer.camera.getState()));
}

export function buildIsometricRendererDebugStats(renderer) {
  return createDebugStats(buildIsometricDebugStatsPayload({
    smoothedFps: renderer.smoothedFps,
    quality: renderer.qualityController.getQuality(),
    particleCount: renderer.particles.particles.length,
    particleCap: renderer.particles.maxParticles,
  }));
}

