import { BUILDING_DEFINITIONS } from '../content/buildings.js';
import { getScenarioDefinition } from '../content/scenarios.js';

const OBJECTIVE_DEFINITIONS = [
  {
    id: 'settle-foundation',
    title: 'Expand Housing',
    description: 'Construct at least 2 housing buildings.',
    reward: {
      resources: { wood: 20, stone: 12 },
      moraleBoost: 2,
    },
    isComplete: (state) => {
      const housingCount = state.buildings.filter((building) => {
        const definition = BUILDING_DEFINITIONS[building.type];
        return definition?.category === 'housing';
      }).length;
      return housingCount >= 2;
    },
  },
  {
    id: 'food-security',
    title: 'Secure Food',
    description: 'Reach 150 food reserves and build an extra farm.',
    reward: {
      resources: { food: 35, medicine: 2 },
      moraleBoost: 3,
    },
    isComplete: (state) => {
      const farms = state.buildings.filter((building) => building.type === 'farm').length;
      return state.resources.food >= 150 && farms >= 2;
    },
  },
  {
    id: 'knowledge-base',
    title: 'Build Knowledge Base',
    description: 'Generate 40 knowledge or build a library.',
    reward: {
      resources: { knowledge: 15, tools: 3 },
      moraleBoost: 2,
    },
    isComplete: (state) => {
      const hasLibrary = state.buildings.some((building) => building.type === 'library');
      return state.resources.knowledge >= 40 || hasLibrary;
    },
  },
  {
    id: 'research-masonry',
    title: 'Research Masonry',
    description: 'Complete Masonry research to unlock stronger housing.',
    reward: {
      resources: { wood: 25, stone: 15 },
      moraleBoost: 1,
    },
    isComplete: (state) => state.research.completed.includes('masonry'),
  },
  {
    id: 'population-growth',
    title: 'Grow Population',
    description: 'Reach at least 10 living colonists.',
    reward: {
      resources: { food: 30, medicine: 3 },
      moraleBoost: 4,
    },
    isComplete: (state) => state.colonists.filter((colonist) => colonist.alive).length >= 10,
  },
];

export function getObjectiveDefinitions() {
  return OBJECTIVE_DEFINITIONS;
}

export function getCurrentObjectiveIds(state) {
  return OBJECTIVE_DEFINITIONS.map((objective) => objective.id).filter(
    (objectiveId) => !state.objectives.completed.includes(objectiveId),
  );
}

export function getObjectiveRewardMultiplier(state) {
  const scenario = getScenarioDefinition(state?.scenarioId);
  return scenario.objectiveRewardMultiplier ?? 1;
}

function toScaledRewardAmount(amount, multiplier) {
  const scaled = Math.round(amount * multiplier);
  return Math.max(1, scaled);
}

function getScaledReward(reward, multiplier) {
  if (!reward) {
    return null;
  }

  const scaled = {
    resources: {},
    moraleBoost: reward.moraleBoost
      ? toScaledRewardAmount(reward.moraleBoost, multiplier)
      : 0,
  };

  for (const [resourceKey, amount] of Object.entries(reward.resources ?? {})) {
    scaled.resources[resourceKey] = toScaledRewardAmount(amount, multiplier);
  }

  return scaled;
}

function applyObjectiveReward(state, objective, multiplier) {
  if (!objective.reward) {
    return;
  }

  const scaledReward = getScaledReward(objective.reward, multiplier);

  for (const [resourceKey, amount] of Object.entries(scaledReward.resources ?? {})) {
    state.resources[resourceKey] = Math.max(0, (state.resources[resourceKey] ?? 0) + amount);
  }

  if (scaledReward.moraleBoost) {
    for (const colonist of state.colonists) {
      if (!colonist.alive) {
        continue;
      }
      colonist.needs.morale = Math.min(100, colonist.needs.morale + scaledReward.moraleBoost);
    }
  }
}

export function formatObjectiveReward(objective, multiplier = 1) {
  const scaledReward = getScaledReward(objective.reward, multiplier);
  const resourceParts = Object.entries(scaledReward?.resources ?? {}).map(
    ([resourceKey, amount]) => `${amount} ${resourceKey}`,
  );
  const moralePart = scaledReward?.moraleBoost ? `+${scaledReward.moraleBoost} morale` : null;
  return [...resourceParts, moralePart].filter(Boolean).join(', ');
}

export function runObjectiveSystem(context) {
  const { state, emit } = context;
  if (state.status !== 'playing') {
    return;
  }
  const rewardMultiplier = getObjectiveRewardMultiplier(state);

  for (const objective of OBJECTIVE_DEFINITIONS) {
    if (state.objectives.completed.includes(objective.id)) {
      continue;
    }
    if (!objective.isComplete(state)) {
      continue;
    }

    state.objectives.completed.push(objective.id);
    state.metrics.objectivesCompleted += 1;
    applyObjectiveReward(state, objective, rewardMultiplier);
    emit('objective-complete', {
      kind: 'success',
      message: `Objective complete: ${objective.title}${objective.reward ? ` (Reward: ${formatObjectiveReward(objective, rewardMultiplier)})` : ''}`,
    });
  }
}
