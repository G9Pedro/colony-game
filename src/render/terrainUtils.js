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

function collectStructurePoints(state) {
  return [
    ...state.buildings.map((building) => ({
      x: Math.round(building.x),
      z: Math.round(building.z),
      type: building.type,
    })),
    ...state.constructionQueue.map((item) => ({
      x: Math.round(item.x),
      z: Math.round(item.z),
      type: item.type,
    })),
  ];
}

export function buildStructureTileSet(state) {
  const set = new Set();
  const structures = collectStructurePoints(state);
  structures.forEach((structure) => {
    set.add(`${structure.x}:${structure.z}`);
  });
  return set;
}

export function buildTerrainSignature(state) {
  let hash = 0;
  const structures = collectStructurePoints(state)
    .sort((a, b) => a.x - b.x || a.z - b.z || a.type.localeCompare(b.type));
  for (const structure of structures) {
    const x = structure.x & 0xffff;
    const z = structure.z & 0xffff;
    hash = ((hash * 33) ^ x) >>> 0;
    hash = ((hash * 33) ^ z) >>> 0;
    for (let idx = 0; idx < structure.type.length; idx += 1) {
      hash = ((hash * 33) ^ structure.type.charCodeAt(idx)) >>> 0;
    }
  }
  return `${structures.length}:${hash}`;
}

export function buildPathTileSet(state) {
  const structures = collectStructurePoints(state);
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

