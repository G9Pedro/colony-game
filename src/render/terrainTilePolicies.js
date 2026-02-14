export function sampleTerrainTileNoise(x, z, salt = 0) {
  const value = Math.sin((x + 3.31 + salt) * 127.1 + (z + 7.17 - salt) * 311.7) * 43758.5453123;
  return value - Math.floor(value);
}

export function resolveTerrainVariant(x, z, {
  variantCount = 4,
  sampleNoise = sampleTerrainTileNoise,
} = {}) {
  return Math.floor(sampleNoise(x, z) * variantCount);
}

export function resolveTerrainKind({ onPath, nearBuilding }) {
  if (onPath) {
    return 'path';
  }
  if (nearBuilding) {
    return 'dirt';
  }
  return 'grass';
}
