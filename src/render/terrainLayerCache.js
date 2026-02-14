export function createTerrainLayerCacheState() {
  return {
    valid: false,
    centerX: 0,
    centerZ: 0,
    zoom: 0,
    minX: 0,
    maxX: 0,
    minZ: 0,
    maxZ: 0,
    buildingSignature: '',
    width: 0,
    height: 0,
    dpr: 1,
  };
}

export function buildTerrainLayerCacheSnapshot({
  camera,
  bounds,
  dpr,
  signature,
}) {
  return {
    valid: true,
    centerX: camera.centerX,
    centerZ: camera.centerZ,
    zoom: camera.zoom,
    minX: bounds.minX,
    maxX: bounds.maxX,
    minZ: bounds.minZ,
    maxZ: bounds.maxZ,
    buildingSignature: signature,
    width: camera.viewportWidth,
    height: camera.viewportHeight,
    dpr,
  };
}

export function createTerrainLayerRefreshPayload({
  camera,
  bounds,
  dpr,
  signature,
}) {
  return {
    centerX: camera.centerX,
    centerZ: camera.centerZ,
    zoom: camera.zoom,
    minX: bounds.minX,
    maxX: bounds.maxX,
    minZ: bounds.minZ,
    maxZ: bounds.maxZ,
    width: camera.viewportWidth,
    height: camera.viewportHeight,
    dpr,
    signature,
  };
}
