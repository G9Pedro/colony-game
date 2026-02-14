import { normalizeCameraState } from './cameraState.js';
import { normalizeDebugStats } from './debugStats.js';

export function buildSceneRendererCameraState(renderer) {
  const rawCameraState = renderer.activeRenderer?.getCameraState?.();
  return normalizeCameraState(rawCameraState, {
    mode: renderer.mode,
    projection: renderer.mode === 'three' ? 'perspective' : 'isometric',
  });
}

export function buildSceneRendererDebugStats(renderer) {
  const rawStats = renderer.activeRenderer?.getDebugStats?.();
  return normalizeDebugStats(rawStats, renderer.mode);
}

