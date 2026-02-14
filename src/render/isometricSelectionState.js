export function applyIsometricSelectedEntity(renderer, entity) {
  renderer.selectedEntity = entity ?? null;
  renderer.onEntitySelect?.(renderer.selectedEntity);
}

export function buildIsometricHoverSelectionInvocation(renderer, localX, localY) {
  return {
    interactiveEntities: renderer.interactiveEntities,
    localX,
    localY,
    setHoveredEntity: (entity) => {
      renderer.hoveredEntity = entity;
    },
  };
}

export function buildIsometricClickSelectionInvocation(renderer, localX, localY, tile) {
  return {
    interactiveEntities: renderer.interactiveEntities,
    localX,
    localY,
    tile,
    selectedBuildingType: renderer.lastState?.selectedBuildingType,
    setSelectedEntity: (entity) => applyIsometricSelectedEntity(renderer, entity),
    onGroundClick: renderer.onGroundClick,
  };
}

