export function reconcileMeshMap({
  entities,
  meshMap,
  scene,
  getId,
  createMesh,
}) {
  const liveIds = new Set(entities.map((entity) => getId(entity)));

  for (const [id, mesh] of meshMap.entries()) {
    if (liveIds.has(id)) {
      continue;
    }
    scene.remove(mesh);
    mesh.geometry.dispose();
    mesh.material.dispose();
    meshMap.delete(id);
  }

  for (const entity of entities) {
    const id = getId(entity);
    if (meshMap.has(id)) {
      continue;
    }
    const mesh = createMesh(entity);
    meshMap.set(id, mesh);
    scene.add(mesh);
  }
}

export function updateColonistMeshPose(mesh, colonist, timeSeconds) {
  mesh.position.x = colonist.position.x;
  mesh.position.z = colonist.position.z;
  mesh.position.y = 0.3 + Math.sin((timeSeconds + colonist.age) * 2) * 0.04;
}

