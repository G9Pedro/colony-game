export const LEGACY_BUILDING_Y_BASE = 0.01;

export function createLegacyBuildingMesh(building, buildingDefinitions, three) {
  const definition = buildingDefinitions[building.type];
  const [sx, sy, sz] = definition.size;
  const geometry = new three.BoxGeometry(sx, sy, sz);
  const material = new three.MeshLambertMaterial({ color: definition.color });
  const mesh = new three.Mesh(geometry, material);
  mesh.position.set(building.x, LEGACY_BUILDING_Y_BASE + sy / 2, building.z);
  mesh.userData.entityId = building.id;
  mesh.userData.entityType = 'building';
  return mesh;
}

export function createLegacyColonistMesh(colonist, three) {
  const geometry = new three.SphereGeometry(0.28, 12, 12);
  const color = colonist.job === 'builder' ? 0xf59e0b : 0xf97316;
  const material = new three.MeshLambertMaterial({ color });
  const mesh = new three.Mesh(geometry, material);
  mesh.position.set(colonist.position.x, 0.32, colonist.position.z);
  mesh.userData.entityId = colonist.id;
  mesh.userData.entityType = 'colonist';
  return mesh;
}

