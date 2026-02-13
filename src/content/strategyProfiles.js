export const STRATEGY_PROFILES = {
  baseline: {
    id: 'baseline',
    name: 'Baseline Expansion',
    description: 'Balanced early-game growth strategy used for regression checks.',
    buildActions: [
      { step: 0, type: 'hut', x: 14, z: -14 },
      { step: 0, type: 'farm', x: -14, z: -14 },
      { step: 20, type: 'lumberCamp', x: -15, z: 14 },
      { step: 90, type: 'school', x: 14, z: 0 },
    ],
    hireSteps: [140, 220],
    researchActions: [
      { startAtStep: 300, techId: 'masonry' },
    ],
    steps: 900,
  },
};

export function getStrategyProfile(profileId) {
  return STRATEGY_PROFILES[profileId] ?? STRATEGY_PROFILES.baseline;
}
