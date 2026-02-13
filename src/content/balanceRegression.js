export const BALANCE_REGRESSION_CASES = [
  { scenarioId: 'frontier', balanceProfileId: 'standard', seed: 'balance-frontier-standard' },
  { scenarioId: 'frontier', balanceProfileId: 'forgiving', seed: 'balance-frontier-forgiving' },
  { scenarioId: 'frontier', balanceProfileId: 'brutal', seed: 'balance-frontier-brutal' },
  { scenarioId: 'prosperous', balanceProfileId: 'standard', seed: 'balance-prosperous-standard' },
  { scenarioId: 'prosperous', balanceProfileId: 'forgiving', seed: 'balance-prosperous-forgiving' },
  { scenarioId: 'prosperous', balanceProfileId: 'brutal', seed: 'balance-prosperous-brutal' },
  { scenarioId: 'harsh', balanceProfileId: 'standard', seed: 'balance-harsh-standard' },
  { scenarioId: 'harsh', balanceProfileId: 'forgiving', seed: 'balance-harsh-forgiving' },
  { scenarioId: 'harsh', balanceProfileId: 'brutal', seed: 'balance-harsh-brutal' },
];

export const BALANCE_REGRESSION_EXPECTATIONS = {
  'frontier:standard': { requiredStatus: 'playing', minAlivePopulation: 8, requiredResearch: [] },
  'frontier:forgiving': { requiredStatus: 'playing', minAlivePopulation: 8, requiredResearch: [] },
  'frontier:brutal': { requiredStatus: 'playing', minAlivePopulation: 8, requiredResearch: [] },
  'prosperous:standard': { requiredStatus: 'playing', minAlivePopulation: 9, requiredResearch: ['masonry'] },
  'prosperous:forgiving': { requiredStatus: 'playing', minAlivePopulation: 9, requiredResearch: ['masonry'] },
  'prosperous:brutal': { requiredStatus: 'lost', minAlivePopulation: 0, requiredResearch: ['masonry'] },
  'harsh:standard': { requiredStatus: 'playing', minAlivePopulation: 7, requiredResearch: [] },
  'harsh:forgiving': { requiredStatus: 'playing', minAlivePopulation: 7, requiredResearch: [] },
  'harsh:brutal': { requiredStatus: 'lost', minAlivePopulation: 0, requiredResearch: [] },
};
