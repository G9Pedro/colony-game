export { buildPathTileSet } from './terrainPathing.js';
export { buildTerrainSignature } from './terrainSignature.js';
export { buildStructureTileSet } from './terrainStructures.js';

export function getTerrainBoundsFromCorners(corners, padding = 3) {
  const minX = Math.min(...corners.map((point) => point.x));
  const maxX = Math.max(...corners.map((point) => point.x));
  const minZ = Math.min(...corners.map((point) => point.z));
  const maxZ = Math.max(...corners.map((point) => point.z));
  return {
    minX: Math.floor(minX) - padding,
    maxX: Math.ceil(maxX) + padding,
    minZ: Math.floor(minZ) - padding,
    maxZ: Math.ceil(maxZ) + padding,
  };
}

