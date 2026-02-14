export function clampThreeCameraRadius(radius, min = 16, max = 68) {
  return Math.max(min, Math.min(max, radius));
}

export function clampThreeCameraPitch(pitch, min = 0.25, max = 1.25) {
  return Math.max(min, Math.min(max, pitch));
}

export function updateOrbitYawAndPitch(cameraPolar, dx, dy, rotateFactor = 0.0055) {
  return {
    yaw: cameraPolar.yaw - dx * rotateFactor,
    pitch: clampThreeCameraPitch(cameraPolar.pitch + dy * rotateFactor),
  };
}

export function updateRadiusFromWheel(currentRadius, wheelDeltaY, wheelFactor = 0.03) {
  return clampThreeCameraRadius(currentRadius + wheelDeltaY * wheelFactor);
}

export function updateRadiusFromPinch(currentRadius, previousDistance, nextDistance, pinchFactor = 0.04) {
  const delta = previousDistance - nextDistance;
  return {
    radius: clampThreeCameraRadius(currentRadius + delta * pinchFactor),
    distance: nextDistance,
  };
}

