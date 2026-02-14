import { screenToWorldPoint, worldToScreenPoint } from './isometricProjection.js';

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
