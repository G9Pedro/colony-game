import { BUILDING_DEFINITIONS } from '../content/buildings.js';

const OBJECTIVE_DEFINITIONS = [
  {
    id: 'settle-foundation',
    title: 'Expand Housing',
    description: 'Construct at least 2 housing buildings.',
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
    isComplete: (state) => {
      const farms = state.buildings.filter((building) => building.type === 'farm').length;
      return state.resources.food >= 150 && farms >= 2;
    },
  },
  {
    id: 'knowledge-base',
    title: 'Build Knowledge Base',
    description: 'Generate 40 knowledge or build a library.',
    isComplete: (state) => {
      const hasLibrary = state.buildings.some((building) => building.type === 'library');
      return state.resources.knowledge >= 40 || hasLibrary;
    },
  },
  {
    id: 'research-masonry',
    title: 'Research Masonry',
    description: 'Complete Masonry research to unlock stronger housing.',
    isComplete: (state) => state.research.completed.includes('masonry'),
  },
  {
    id: 'population-growth',
    title: 'Grow Population',
    description: 'Reach at least 10 living colonists.',
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
    emit('objective-complete', {
      kind: 'success',
      message: `Objective complete: ${objective.title}`,
    });
  }
}
