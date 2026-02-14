import { clampCameraCenter } from './isometricCameraState.js';

export function setIsometricCameraViewport(camera, width, height) {
  camera.viewportWidth = Math.max(1, width);
  camera.viewportHeight = Math.max(1, height);
}

export function clampIsometricCameraCenter(camera, deps = {}) {
  const clampCenter = deps.clampCenter ?? clampCameraCenter;
  const clamped = clampCenter(camera.centerX, camera.centerZ, {
    worldRadius: camera.worldRadius,
  });
  camera.centerX = clamped.centerX;
  camera.centerZ = clamped.centerZ;
}

export function setIsometricCameraWorldRadius(camera, radius, deps = {}) {
  const minimumWorldRadius = deps.minimumWorldRadius ?? 4;
  camera.worldRadius = Math.max(minimumWorldRadius, radius);
  clampIsometricCameraCenter(camera, deps);
}
