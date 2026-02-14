export function resolveClickSelectionOutcome({
  selectedBuildingType,
  hitEntity,
}) {
  if (!selectedBuildingType && hitEntity) {
    return {
      selectionAction: 'set',
      selectedEntity: hitEntity,
      shouldGroundClick: false,
    };
  }

  if (!selectedBuildingType) {
    return {
      selectionAction: 'clear',
      selectedEntity: null,
      shouldGroundClick: true,
    };
  }

  return {
    selectionAction: 'keep',
    selectedEntity: null,
    shouldGroundClick: true,
  };
}

