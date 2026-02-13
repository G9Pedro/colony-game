export const AGGREGATE_BASELINE_BOUNDS = {
  frontier: {
    alivePopulationMean: { min: 7.9, max: 8.1 },
    buildingsMean: { min: 8.9, max: 9.1 },
    dayMean: { min: 7.9, max: 8.1 },
    survivalRate: { min: 1, max: 1 },
    masonryCompletionRate: { min: 0, max: 0 },
  },
  prosperous: {
    alivePopulationMean: { min: 8.9, max: 9.1 },
    buildingsMean: { min: 8.9, max: 9.1 },
    dayMean: { min: 7.9, max: 8.1 },
    survivalRate: { min: 1, max: 1 },
    masonryCompletionRate: { min: 1, max: 1 },
  },
  harsh: {
    alivePopulationMean: { min: 6.9, max: 7.1 },
    buildingsMean: { min: 7.9, max: 8.1 },
    dayMean: { min: 7.9, max: 8.1 },
    survivalRate: { min: 1, max: 1 },
    masonryCompletionRate: { min: 0, max: 0 },
  },
};
