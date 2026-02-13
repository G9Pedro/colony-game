function formatResourceFlow(flow = {}) {
  const entries = Object.entries(flow);
  if (entries.length === 0) {
    return '—';
  }
  return entries.map(([resource, value]) => `${value.toFixed(2)} ${resource}`).join(', ');
}

export function buildBuildingSelectionDetails(selection, state, buildingDefinitions) {
  const building = state.buildings.find((item) => item.id === selection.id);
  const definition = building ? buildingDefinitions[building.type] : null;
  if (!building || !definition) {
    return {
      title: 'Building',
      rows: [],
      message: 'Building data unavailable.',
    };
  }

  const assignedColonists = state.colonists
    .filter((colonist) => colonist.alive && colonist.assignedBuildingId === building.id)
    .slice(0, 4)
    .map((colonist) => colonist.name);

  return {
    title: definition.name,
    rows: [
      { label: 'Type', value: definition.category },
      { label: 'Health', value: Math.floor(building.health).toString() },
      { label: 'Workers', value: building.workersAssigned.toString() },
      { label: 'Operational', value: building.isOperational ? 'Yes' : 'No' },
      { label: 'Input/worker', value: formatResourceFlow(definition.inputPerWorker) },
      { label: 'Output/worker', value: formatResourceFlow(definition.outputPerWorker) },
      {
        label: 'Assigned',
        value: assignedColonists.length > 0 ? assignedColonists.join(', ') : 'No assigned colonists',
      },
    ],
    message: null,
  };
}

export function buildColonistSelectionDetails(selection, state) {
  const colonist = state.colonists.find((item) => item.id === selection.id);
  if (!colonist) {
    return {
      title: 'Colonist',
      rows: [],
      message: 'Colonist data unavailable.',
    };
  }

  return {
    title: colonist.name,
    rows: [
      { label: 'Job', value: colonist.job },
      { label: 'Task', value: colonist.task },
      { label: 'Assigned Building', value: colonist.assignedBuildingId ?? 'None' },
      { label: 'Morale', value: Math.floor(colonist.needs.morale).toString() },
      { label: 'Hunger', value: Math.floor(colonist.needs.hunger).toString() },
      { label: 'Health', value: Math.floor(colonist.needs.health).toString() },
    ],
    message: null,
  };
}

