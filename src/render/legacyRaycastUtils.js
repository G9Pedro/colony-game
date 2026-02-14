export function clientToNdc(clientX, clientY, rect) {
  return {
    x: ((clientX - rect.left) / rect.width) * 2 - 1,
    y: -((clientY - rect.top) / rect.height) * 2 + 1,
  };
}

export function buildEntitySelectionFromObject(object3d) {
  const entityId = object3d?.userData?.entityId;
  const entityType = object3d?.userData?.entityType;
  if (!entityId || !entityType) {
    return null;
  }
  return {
    type: entityType,
    id: entityId,
    [entityType === 'building' ? 'buildingId' : 'colonistId']: entityId,
    x: object3d.position.x,
    z: object3d.position.z,
  };
}

