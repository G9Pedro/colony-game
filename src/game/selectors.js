import { BUILDING_DEFINITIONS } from '../content/buildings.js';

export function getAliveColonists(state) {
  return state.colonists.filter((colonist) => colonist.alive);
}

export function getAverageMorale(state) {
  const alive = getAliveColonists(state);
  if (alive.length === 0) {
    return 0;
  }

  const total = alive.reduce((sum, colonist) => sum + colonist.needs.morale, 0);
  return total / alive.length;
}

export function getPopulationCapacity(state) {
  return (
    state.rules.basePopulationCap +
    state.buildings.reduce((cap, building) => {
      const definition = BUILDING_DEFINITIONS[building.type];
      return cap + (definition.populationCap ?? 0);
    }, 0)
  );
}

export function getStorageCapacity(state) {
  return (
    state.rules.baseStorageCapacity +
    state.buildings.reduce((cap, building) => {
      const definition = BUILDING_DEFINITIONS[building.type];
      return cap + (definition.storageCap ?? 0);
    }, 0)
  );
}

export function getUsedStorage(state) {
  return Object.values(state.resources).reduce((sum, amount) => sum + Math.max(0, amount), 0);
}

export function getAvailableResearch(state, researchDefinitions) {
  return Object.values(researchDefinitions).filter((item) => {
    if (state.research.completed.includes(item.id)) {
      return false;
    }

    const meetsPrereq = item.prerequisites.every((prereqId) =>
      state.research.completed.includes(prereqId),
    );
    return meetsPrereq;
  });
}

export function isBuildingUnlocked(state, buildingDefinition) {
  if (!buildingDefinition.requiredTech) {
    return true;
  }

  return state.research.completed.includes(buildingDefinition.requiredTech);
}
