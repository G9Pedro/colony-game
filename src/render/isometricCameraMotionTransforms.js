import { computeCameraZoomStep } from './isometricCameraPolicies.js';
import { screenDeltaToWorldDelta } from './isometricProjection.js';
import { applyCameraInertia } from './isometricCameraState.js';
import { unprojectIsometricCameraScreenPoint } from './isometricCameraCoordinateTransforms.js';

export function panIsometricCameraByScreenDelta(camera, deltaX, deltaY, deps = {}) {
  const computeWorldDelta = deps.computeWorldDelta ?? screenDeltaToWorldDelta;
  const worldDelta = computeWorldDelta({
    deltaX,
    deltaY,
    zoom: camera.zoom,
    tileWidth: camera.tileWidth,
    tileHeight: camera.tileHeight,
  });
  if (!worldDelta) {
    return;
  }
  camera.centerX -= worldDelta.worldDeltaX;
  camera.centerZ -= worldDelta.worldDeltaZ;
  camera.clampCenter();
}

export function zoomIsometricCameraAtScreenPoint(camera, {
  delta,
  screenX,
  screenY,
}, deps = {}) {
  const screenToWorld = deps.screenToWorld ?? ((x, y) => unprojectIsometricCameraScreenPoint(camera, x, y));
  const computeZoomStep = deps.computeZoomStep ?? computeCameraZoomStep;

  const before = screenToWorld(screenX, screenY);
  const nextZoom = computeZoomStep({
    zoom: camera.zoom,
    delta,
    minZoom: camera.minZoom,
    maxZoom: camera.maxZoom,
  });
  camera.zoom = nextZoom;
  const after = screenToWorld(screenX, screenY);
  camera.centerX += before.x - after.x;
  camera.centerZ += before.z - after.z;
  camera.clampCenter();
}

export function updateIsometricCameraInertia(camera, deltaSeconds, deps = {}) {
  if (camera.dragging || camera.pinchState.active) {
    return;
  }
  const applyInertia = deps.applyInertia ?? applyCameraInertia;
  const nextState = applyInertia({
    centerX: camera.centerX,
    centerZ: camera.centerZ,
    velocityX: camera.velocityX,
    velocityZ: camera.velocityZ,
    deltaSeconds,
  });
  camera.centerX = nextState.centerX;
  camera.centerZ = nextState.centerZ;
  camera.velocityX = nextState.velocityX;
  camera.velocityZ = nextState.velocityZ;
  camera.clampCenter();
}

export function centerIsometricCameraOn(camera, worldX, worldZ) {
  camera.centerX = worldX;
  camera.centerZ = worldZ;
  camera.velocityX = 0;
  camera.velocityZ = 0;
  camera.clampCenter();
}
