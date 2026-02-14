export function syncLegacyBuildingMeshes({
  state,
  buildingMeshes,
  scene,
  three,
  buildingDefinitions,
  reconcileMeshMap,
  createLegacyBuildingMesh,
}) {
  reconcileMeshMap({
    entities: state.buildings,
    meshMap: buildingMeshes,
    scene,
    getId: (building) => building.id,
    createMesh: (building) => createLegacyBuildingMesh(building, buildingDefinitions, three),
  });
}

export function syncLegacyColonistMeshes({
  state,
  colonistMeshes,
  scene,
  three,
  reconcileMeshMap,
  createLegacyColonistMesh,
  updateColonistMeshPose,
}) {
  const liveColonists = state.colonists.filter((colonist) => colonist.alive);
  reconcileMeshMap({
    entities: liveColonists,
    meshMap: colonistMeshes,
    scene,
    getId: (colonist) => colonist.id,
    createMesh: (colonist) => createLegacyColonistMesh(colonist, three),
  });

  for (const colonist of liveColonists) {
    const mesh = colonistMeshes.get(colonist.id);
    if (!mesh) {
      continue;
    }
    updateColonistMeshPose(mesh, colonist, state.timeSeconds);
  }
}

