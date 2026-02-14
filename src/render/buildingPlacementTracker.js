export function diffNewBuildingPlacements(buildings, knownBuildingIds) {
  const nextIds = new Set();
  const newBuildings = [];
  for (const building of buildings) {
    nextIds.add(building.id);
    if (!knownBuildingIds.has(building.id)) {
      newBuildings.push(building);
    }
  }
  return {
    nextIds,
    newBuildings,
  };
}

