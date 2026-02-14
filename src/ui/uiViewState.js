export function buildTopSummary(state, {
  getPopulationCapacity,
  getAverageMorale,
  getUsedStorage,
  getStorageCapacity,
}) {
  const alivePopulation = state.colonists.filter((colonist) => colonist.alive).length;
  const populationCap = getPopulationCapacity(state);
  const avgMorale = getAverageMorale(state);
  const storageUsed = getUsedStorage(state);
  const storageCap = getStorageCapacity(state);

  return {
    populationText: `${alivePopulation} / ${populationCap}`,
    moraleText: Math.floor(avgMorale).toString(),
    storageText: `${Math.floor(storageUsed)} / ${storageCap}`,
  };
}

export function getRendererModeLabel(mode) {
  return mode === 'isometric' ? 'Isometric' : 'Three.js';
}

export function getStatusBannerMessage(status) {
  if (status === 'won') {
    return 'Victory! Colony Charter Achieved.';
  }
  if (status === 'lost') {
    return 'Defeat. Reset to start a new colony.';
  }
  return null;
}

