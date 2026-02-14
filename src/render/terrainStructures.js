export function collectStructurePoints(state) {
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

export function buildStructureTileSet(state, deps = {}) {
  const collectStructures = deps.collectStructures ?? collectStructurePoints;
  const set = new Set();
  const structures = collectStructures(state);
  structures.forEach((structure) => {
    set.add(`${structure.x}:${structure.z}`);
  });
  return set;
}
