import { BUILDING_DEFINITIONS } from '../content/buildings.js';

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

function applyObjectiveReward(state, objective) {
  if (!objective.reward) {
    return;
  }

  for (const [resourceKey, amount] of Object.entries(objective.reward.resources ?? {})) {
    state.resources[resourceKey] = Math.max(0, (state.resources[resourceKey] ?? 0) + amount);
  }

  if (objective.reward.moraleBoost) {
    for (const colonist of state.colonists) {
      if (!colonist.alive) {
        continue;
      }
      colonist.needs.morale = Math.min(100, colonist.needs.morale + objective.reward.moraleBoost);
    }
  }
}

function describeReward(objective) {
  const resourceParts = Object.entries(objective.reward?.resources ?? {}).map(
    ([resourceKey, amount]) => `${amount} ${resourceKey}`,
  );
  const moralePart = objective.reward?.moraleBoost ? `+${objective.reward.moraleBoost} morale` : null;
  return [...resourceParts, moralePart].filter(Boolean).join(', ');
}

export function runObjectiveSystem(context) {
  const { state, emit } = context;
  if (state.status !== 'playing') {
    return;
  }

  for (const objective of OBJECTIVE_DEFINITIONS) {
    if (state.objectives.completed.includes(objective.id)) {
      continue;
    }
    if (!objective.isComplete(state)) {
      continue;
    }

    state.objectives.completed.push(objective.id);
    state.metrics.objectivesCompleted += 1;
    applyObjectiveReward(state, objective);
    emit('objective-complete', {
      kind: 'success',
      message: `Objective complete: ${objective.title}${objective.reward ? ` (Reward: ${describeReward(objective)})` : ''}`,
    });
  }
}
