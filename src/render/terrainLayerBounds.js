import { getTerrainBoundsFromCorners } from './terrainUtils.js';

export function buildTerrainLayerCameraCorners(camera) {
  return [
    camera.screenToWorld(0, 0),
    camera.screenToWorld(camera.viewportWidth, 0),
    camera.screenToWorld(0, camera.viewportHeight),
    camera.screenToWorld(camera.viewportWidth, camera.viewportHeight),
  ];
}

export function resolveTerrainLayerBounds(camera, padding = 3, deps = {}) {
  const getBounds = deps.getBounds ?? getTerrainBoundsFromCorners;
  const corners = buildTerrainLayerCameraCorners(camera);
  return getBounds(corners, padding);
}
