import { collectStructurePoints } from './terrainStructures.js';

export function buildPathTileSet(state, deps = {}) {
  const collectStructures = deps.collectStructures ?? collectStructurePoints;
  const structures = collectStructures(state);
  const pathTiles = new Set();
  if (structures.length < 2) {
    return pathTiles;
  }

  for (let index = 0; index < structures.length; index += 1) {
    const source = structures[index];
    let nearest = null;
    let nearestDistance = Number.POSITIVE_INFINITY;
    for (let otherIndex = 0; otherIndex < structures.length; otherIndex += 1) {
      if (index === otherIndex) {
        continue;
      }
      const target = structures[otherIndex];
      const distance = Math.abs(target.x - source.x) + Math.abs(target.z - source.z);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = target;
      }
    }
    if (!nearest) {
      continue;
    }

    let x = source.x;
    let z = source.z;
    pathTiles.add(`${x}:${z}`);
    while (x !== nearest.x) {
      x += x < nearest.x ? 1 : -1;
      pathTiles.add(`${x}:${z}`);
    }
    while (z !== nearest.z) {
      z += z < nearest.z ? 1 : -1;
      pathTiles.add(`${x}:${z}`);
    }
  }

  return pathTiles;
}
