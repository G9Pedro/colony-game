import { normalizeCameraState } from './cameraState.js';
import { createDebugStats } from './debugStats.js';
import { buildLegacyCameraStatePayload, buildLegacyDebugStatsPayload } from './legacyRendererViewState.js';

export function buildLegacyCameraState({
  rootElement,
  cameraTarget,
  worldRadius = 30,
}) {
  const payload = buildLegacyCameraStatePayload(rootElement, cameraTarget, worldRadius);
  return normalizeCameraState(payload, {
    mode: 'three',
    projection: 'perspective',
  });
}

export function buildLegacyDebugStats(smoothedFps) {
  return createDebugStats(buildLegacyDebugStatsPayload(smoothedFps));
}

