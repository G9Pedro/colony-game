export function buildLegacyCameraStatePayload(rootElement, cameraTarget, worldRadius = 30) {
  return {
    mode: 'three',
    projection: 'perspective',
    centerX: cameraTarget.x,
    centerZ: cameraTarget.z,
    zoom: 1,
    width: rootElement.clientWidth,
    height: rootElement.clientHeight,
    worldRadius,
  };
}

export function buildLegacyDebugStatsPayload(smoothedFps) {
  return {
    mode: 'three',
    fps: smoothedFps,
    quality: 1,
    particles: 0,
    particleCap: 0,
  };
}

export function applyLegacyPreviewMarker(previewMarker, position, valid = true) {
  if (!position) {
    previewMarker.visible = false;
    return;
  }
  previewMarker.visible = true;
  previewMarker.position.x = position.x;
  previewMarker.position.z = position.z;
  previewMarker.material.color.setHex(valid ? 0x22c55e : 0xef4444);
}

