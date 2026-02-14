export function buildIsometricCameraStatePayload(cameraState) {
  return {
    ...cameraState,
    mode: 'isometric',
    projection: 'isometric',
  };
}

export function buildIsometricDebugStatsPayload({
  smoothedFps,
  quality,
  particleCount,
  particleCap,
}) {
  return {
    mode: 'isometric',
    fps: smoothedFps,
    quality,
    particles: particleCount,
    particleCap,
  };
}

