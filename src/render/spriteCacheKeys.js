export function buildTerrainTileCacheKey(kind = 'grass', variant = 0) {
  return `${kind}:${variant}`;
}

export function buildBuildingSpriteCacheKey(type, construction = false) {
  return `${type}:${construction ? 'construction' : 'complete'}`;
}

export function buildBuildingThumbnailCacheKey(type, size = 56) {
  return `${type}:thumb:${size}`;
}

export function buildColonistSpriteCacheKey(job = 'laborer', frame = 0, idle = false) {
  return `${job}:${frame}:${idle ? 1 : 0}`;
}

export function buildResourceIconCacheKey(resourceKey, size = 20) {
  return `${resourceKey}:${size}`;
}

