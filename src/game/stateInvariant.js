function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

export function validateRuntimeState(state) {
  const errors = [];

  if (!state || typeof state !== 'object') {
    return ['State must be an object.'];
  }

  if (!state.resources || typeof state.resources !== 'object') {
    errors.push('resources map is missing.');
  } else {
    for (const [resourceKey, amount] of Object.entries(state.resources)) {
      if (!isFiniteNumber(amount)) {
        errors.push(`resource "${resourceKey}" is not a finite number.`);
        continue;
      }
      if (amount < 0) {
        errors.push(`resource "${resourceKey}" dropped below zero.`);
      }
    }
  }

  if (!Array.isArray(state.colonists)) {
    errors.push('colonists list is missing.');
  } else {
    const seenColonistIds = new Set();
    const buildingIdSet = new Set((state.buildings ?? []).map((building) => building.id));
    for (const colonist of state.colonists) {
      if (seenColonistIds.has(colonist.id)) {
        errors.push(`duplicate colonist id "${colonist.id}".`);
      }
      seenColonistIds.add(colonist.id);

      if (!colonist.alive) {
        continue;
      }
      for (const [needKey, value] of Object.entries(colonist.needs ?? {})) {
        if (!isFiniteNumber(value)) {
          errors.push(`colonist "${colonist.id}" need "${needKey}" is invalid.`);
          continue;
        }
        if (value < 0 || value > 100) {
          errors.push(`colonist "${colonist.id}" need "${needKey}" is out of range.`);
        }
      }

      if (colonist.assignedBuildingId && !buildingIdSet.has(colonist.assignedBuildingId)) {
        errors.push(`colonist "${colonist.id}" references missing building "${colonist.assignedBuildingId}".`);
      }
    }
  }

  if (!Array.isArray(state.buildings)) {
    errors.push('buildings list is missing.');
  } else {
    const seenBuildingIds = new Set();
    for (const building of state.buildings) {
      if (seenBuildingIds.has(building.id)) {
        errors.push(`duplicate building id "${building.id}".`);
      }
      seenBuildingIds.add(building.id);
      if (!Array.isArray(building.size) || building.size.length !== 3) {
        errors.push(`building "${building.id}" has invalid size.`);
      }
    }
  }

  if (!state.objectives || !Array.isArray(state.objectives.completed)) {
    errors.push('objectives.completed is missing.');
  }

  if (!state.metrics || typeof state.metrics !== 'object') {
    errors.push('metrics payload is missing.');
  }

  return errors;
}
