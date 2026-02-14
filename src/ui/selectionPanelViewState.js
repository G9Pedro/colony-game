export function buildSelectionPanelViewModel({
  selection,
  state,
  buildingDefinitions,
  buildBuildingSelectionDetails,
  buildColonistSelectionDetails,
}) {
  if (!selection) {
    return {
      title: 'Selection',
      rows: [],
      message: 'Tap a building or colonist to inspect details.',
    };
  }

  if (selection.type === 'building') {
    return buildBuildingSelectionDetails(selection, state, buildingDefinitions);
  }

  if (selection.type === 'colonist') {
    return buildColonistSelectionDetails(selection, state);
  }

  return {
    title: 'Selection',
    rows: [],
    message: 'Unsupported selection.',
  };
}

