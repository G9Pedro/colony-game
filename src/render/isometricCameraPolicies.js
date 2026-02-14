import { screenDeltaToWorldDelta } from './isometricProjection.js';

export function computeCameraZoomStep({
  zoom,
  delta,
  minZoom,
  maxZoom,
}) {
  return Math.max(minZoom, Math.min(maxZoom, zoom * (1 - delta)));
}

export function computeCameraVelocityFromScreenDelta({
  deltaX,
  deltaY,
  elapsedMilliseconds,
  zoom,
  tileWidth,
  tileHeight,
}) {
  const worldDelta = screenDeltaToWorldDelta({
    deltaX,
    deltaY,
    zoom,
    tileWidth,
    tileHeight,
  });
  if (!worldDelta) {
    return {
      velocityX: 0,
      velocityZ: 0,
    };
  }
  const elapsedSeconds = elapsedMilliseconds / 1000;
  return {
    velocityX: -worldDelta.worldDeltaX / elapsedSeconds,
    velocityZ: -worldDelta.worldDeltaZ / elapsedSeconds,
  };
}

export function didCameraCenterMove(beforeCenter, afterCenter, epsilon = 0.0001) {
  return Math.abs(afterCenter.centerX - beforeCenter.centerX) >= epsilon
    || Math.abs(afterCenter.centerZ - beforeCenter.centerZ) >= epsilon;
}

export function isDragClick(dragDistance, threshold = 5) {
  return dragDistance < threshold;
}

