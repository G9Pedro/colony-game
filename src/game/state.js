import {
  BASE_POPULATION_CAPACITY,
  BASE_STORAGE_CAPACITY,
  RESOURCE_DEFINITIONS,
  RESOURCE_KEYS,
} from '../content/resources.js';
import { BUILDING_DEFINITIONS, STARTING_BUILDINGS } from '../content/buildings.js';

const NAMES = [
  'Aria',
  'Bennett',
  'Cleo',
  'Dorian',
  'Eira',
  'Finch',
  'Galen',
  'Hana',
  'Ivo',
  'Juno',
  'Kira',
  'Luca',
  'Mira',
  'Niko',
  'Orin',
  'Pia',
  'Quin',
  'Rhea',
  'Soren',
  'Tala',
  'Uma',
  'Vik',
  'Wren',
  'Xara',
  'Yori',
  'Zane',
];

const TRAITS = [
  'Hardworking',
  'Calm',
  'Social',
  'Brave',
  'Curious',
  'Practical',
  'Cheerful',
  'Resourceful',
  'Patient',
  'Focused',
];

export const JOB_TYPES = [
  'farmer',
  'lumberjack',
  'miner',
  'artisan',
  'scholar',
  'builder',
  'medic',
  'laborer',
];

export function createBaseResources() {
  return RESOURCE_KEYS.reduce((acc, key) => {
    acc[key] = RESOURCE_DEFINITIONS[key].starting;
    return acc;
  }, {});
}

export function createColonist(id) {
  const name = NAMES[(id - 1) % NAMES.length];
  const trait = TRAITS[(id - 1) % TRAITS.length];
  const jobAffinity = JOB_TYPES[(id - 1) % (JOB_TYPES.length - 1)];

  return {
    id: `colonist-${id}`,
    name,
    trait,
    age: 18 + ((id * 7) % 35),
    alive: true,
    job: 'laborer',
    affinity: jobAffinity,
    task: 'Idle',
    assignedBuildingId: null,
    position: {
      x: (Math.random() - 0.5) * 12,
      z: (Math.random() - 0.5) * 12,
      targetX: (Math.random() - 0.5) * 12,
      targetZ: (Math.random() - 0.5) * 12,
    },
    needs: {
      hunger: 100,
      rest: 100,
      health: 100,
      morale: 72,
    },
    skills: {
      farmer: 1,
      lumberjack: 1,
      miner: 1,
      artisan: 1,
      scholar: 1,
      builder: 1,
      medic: 1,
    },
  };
}

function createStartingBuildings(startId = 1) {
  let entityId = startId;
  const buildings = STARTING_BUILDINGS.map((item) => {
    const definition = BUILDING_DEFINITIONS[item.type];
    const building = {
      id: `building-${entityId++}`,
      type: item.type,
      x: item.x,
      z: item.z,
      isOperational: true,
      health: 100,
      workersAssigned: 0,
      createdAt: 0,
      size: definition.size,
    };
    return building;
  });

  return { buildings, nextEntityId: entityId };
}

export function createInitialState() {
  const { buildings, nextEntityId } = createStartingBuildings();
  const colonists = Array.from({ length: 6 }, (_, index) => createColonist(index + 1));

  return {
    timeSeconds: 0,
    tick: 0,
    day: 1,
    speed: 1,
    paused: false,
    status: 'playing',
    selectedBuildingType: null,
    selectedCategory: 'housing',
    resources: createBaseResources(),
    colonists,
    buildings,
    constructionQueue: [],
    nextEntityId,
    research: {
      completed: [],
      current: null,
      progress: 0,
    },
    metrics: {
      starvationTicks: 0,
      lowMoraleTicks: 0,
      deaths: 0,
    },
    lastAutoSaveAt: 0,
    maxWorldRadius: 27,
    rules: {
      basePopulationCap: BASE_POPULATION_CAPACITY,
      baseStorageCapacity: BASE_STORAGE_CAPACITY,
    },
  };
}

export function cloneState(state) {
  return JSON.parse(JSON.stringify(state));
}
