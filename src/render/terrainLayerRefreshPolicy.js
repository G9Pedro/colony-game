export function hasTerrainLayerBoundsChanged(cache, {
  minX,
  maxX,
  minZ,
  maxZ,
}) {
  return cache.minX !== minX
    || cache.maxX !== maxX
    || cache.minZ !== minZ
    || cache.maxZ !== maxZ;
}

export function shouldRefreshTerrainCache(cache, {
  centerX,
  centerZ,
  zoom,
  minX,
  maxX,
  minZ,
  maxZ,
  width,
  height,
  dpr,
  signature,
}) {
  if (!cache.valid) {
    return true;
  }
  if (cache.width !== width || cache.height !== height) {
    return true;
  }
  if (cache.dpr !== dpr) {
    return true;
  }

  const centerDelta = Math.hypot(cache.centerX - centerX, cache.centerZ - centerZ);
  const zoomDelta = Math.abs(cache.zoom - zoom);
  if (centerDelta > 0.45 || zoomDelta > 0.04 || hasTerrainLayerBoundsChanged(cache, {
    minX,
    maxX,
    minZ,
    maxZ,
  })) {
    return true;
  }

  return cache.buildingSignature !== signature;
}
