import {
  screenDeltaToWorldDelta,
  screenToWorldPoint,
  worldToScreenPoint,
} from './isometricProjection.js';
import { computeCameraZoomStep } from './isometricCameraPolicies.js';
import { applyCameraInertia } from './isometricCameraState.js';

export function projectIsometricCameraWorldPoint(camera, x, z, deps = {}) {
  const projectPoint = deps.projectPoint ?? worldToScreenPoint;
  return projectPoint({
    x,
    z,
    centerX: camera.centerX,
    centerZ: camera.centerZ,
    width: camera.viewportWidth,
    height: camera.viewportHeight,
    zoom: camera.zoom,
    tileWidth: camera.tileWidth,
    tileHeight: camera.tileHeight,
  });
}

export function unprojectIsometricCameraScreenPoint(camera, screenX, screenY, deps = {}) {
  const unprojectPoint = deps.unprojectPoint ?? screenToWorldPoint;
  return unprojectPoint({
    screenX,
    screenY,
    centerX: camera.centerX,
    centerZ: camera.centerZ,
    width: camera.viewportWidth,
    height: camera.viewportHeight,
    zoom: camera.zoom,
    tileWidth: camera.tileWidth,
    tileHeight: camera.tileHeight,
  });
}

export function mapWorldPointToTile(x, z) {
  return {
    x: Math.round(x),
    z: Math.round(z),
  };
}

export function mapScreenPointToTile(camera, screenX, screenY, deps = {}) {
  const screenToWorld = deps.screenToWorld ?? ((x, y) => unprojectIsometricCameraScreenPoint(camera, x, y));
  const world = screenToWorld(screenX, screenY);
  return mapWorldPointToTile(world.x, world.z);
}

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

export function captureIsometricCameraState(camera) {
  return {
    centerX: camera.centerX,
    centerZ: camera.centerZ,
    zoom: camera.zoom,
    tileWidth: camera.tileWidth,
    tileHeight: camera.tileHeight,
    width: camera.viewportWidth,
    height: camera.viewportHeight,
    worldRadius: camera.worldRadius,
  };
}
