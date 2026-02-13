export const SCENARIO_DEFINITIONS = {
  frontier: {
    id: 'frontier',
    name: 'Frontier',
    description: 'Balanced baseline colony conditions.',
    colonistCount: 6,
    startingMorale: 72,
    resourceMultipliers: {
      food: 1,
      wood: 1,
      stone: 1,
      iron: 1,
      tools: 1,
      medicine: 1,
      knowledge: 1,
    },
    ruleAdjustments: {
      populationCap: 0,
      storageCap: 0,
    },
  },
  prosperous: {
    id: 'prosperous',
    name: 'Prosperous',
    description: 'Strong starting supplies with faster expansion runway.',
    colonistCount: 8,
    startingMorale: 78,
    resourceMultipliers: {
      food: 1.35,
      wood: 1.35,
      stone: 1.2,
      iron: 1.2,
      tools: 1.4,
      medicine: 1.5,
      knowledge: 1,
    },
    ruleAdjustments: {
      populationCap: 2,
      storageCap: 120,
    },
  },
  harsh: {
    id: 'harsh',
    name: 'Harsh',
    description: 'Scarce resources and low morale for a difficult run.',
    colonistCount: 5,
    startingMorale: 62,
    resourceMultipliers: {
      food: 0.72,
      wood: 0.8,
      stone: 0.82,
      iron: 0.7,
      tools: 0.6,
      medicine: 0.5,
      knowledge: 1,
    },
    ruleAdjustments: {
      populationCap: -1,
      storageCap: -60,
    },
  },
};

export function getScenarioDefinition(scenarioId) {
  return SCENARIO_DEFINITIONS[scenarioId] ?? SCENARIO_DEFINITIONS.frontier;
}
