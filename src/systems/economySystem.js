import { BUILDING_DEFINITIONS } from '../content/buildings.js';
import { getStorageCapacity, getUsedStorage } from '../game/selectors.js';

const STORAGE_TRIM_ORDER = ['food', 'wood', 'stone', 'iron', 'tools', 'medicine', 'knowledge'];

export function applyResourceDelta(state, resourceKey, delta) {
  const current = state.resources[resourceKey] ?? 0;
  state.resources[resourceKey] = Math.max(0, current + delta);
}

function canAffordInputs(resources, inputPerWorker, workers, deltaSeconds) {
  return Object.entries(inputPerWorker).every(([resource, amount]) => {
    const cost = amount * workers * deltaSeconds;
    return (resources[resource] ?? 0) >= cost;
  });
}

function consumeInputs(state, inputPerWorker, workers, deltaSeconds) {
  for (const [resource, amount] of Object.entries(inputPerWorker)) {
    const delta = amount * workers * deltaSeconds;
    applyResourceDelta(state, resource, -delta);
  }
}

function getMultiplier(map, key) {
  const multiplier = map?.[key];
  if (typeof multiplier !== 'number' || !Number.isFinite(multiplier) || multiplier <= 0) {
    return 1;
  }
  return multiplier;
}

function getNormalizedMultiplierValue(multiplier) {
  if (typeof multiplier !== 'number' || !Number.isFinite(multiplier) || multiplier <= 0) {
    return 1;
  }
  return multiplier;
}

function produceOutputs(
  state,
  outputPerWorker,
  workers,
  deltaSeconds,
  { efficiency = 1, resourceMultipliers = {}, jobMultiplier = 1 } = {},
) {
  for (const [resource, amount] of Object.entries(outputPerWorker)) {
    const resourceMultiplier = getMultiplier(resourceMultipliers, resource);
    const effectiveMultiplier = resourceMultiplier * getNormalizedMultiplierValue(jobMultiplier);
    const delta = amount * workers * deltaSeconds * efficiency * effectiveMultiplier;
    applyResourceDelta(state, resource, delta);
  }
}

function trimToStorageCapacity(state, emit) {
  const storageCap = getStorageCapacity(state);
  let overflow = getUsedStorage(state) - storageCap;

  if (overflow <= 0) {
    return;
  }

  for (const resourceKey of STORAGE_TRIM_ORDER) {
    if (overflow <= 0) {
      break;
    }
    const available = state.resources[resourceKey] ?? 0;
    if (available <= 0) {
      continue;
    }
    const deduction = Math.min(available, overflow);
    state.resources[resourceKey] -= deduction;
    overflow -= deduction;
  }

  emit('storage-overflow', {
    kind: 'warn',
    message: 'Storage overflow caused spoilage. Build warehouses.',
  });
}

export function runEconomySystem(context) {
  const { state, deltaSeconds, emit } = context;
  const resourceMultipliers = state.rules?.productionResourceMultipliers ?? {};
  const jobMultipliers = state.rules?.productionJobMultipliers ?? {};
  const assignmentMap = new Map();

  for (const colonist of state.colonists) {
    if (!colonist.alive || colonist.task !== 'Working' || !colonist.assignedBuildingId) {
      continue;
    }
    const list = assignmentMap.get(colonist.assignedBuildingId) ?? [];
    list.push(colonist);
    assignmentMap.set(colonist.assignedBuildingId, list);
  }

  for (const building of state.buildings) {
    const definition = BUILDING_DEFINITIONS[building.type];
    const assignedWorkers = assignmentMap.get(building.id) ?? [];
    const maxWorkers = definition.workerSlots ?? 0;
    const activeWorkers = assignedWorkers.slice(0, maxWorkers);
    building.workersAssigned = activeWorkers.length;

    if (!definition.outputPerWorker || activeWorkers.length === 0) {
      continue;
    }

    if (definition.inputPerWorker) {
      const inputsAvailable = canAffordInputs(
        state.resources,
        definition.inputPerWorker,
        activeWorkers.length,
        deltaSeconds,
      );

      if (!inputsAvailable) {
        continue;
      }

      consumeInputs(state, definition.inputPerWorker, activeWorkers.length, deltaSeconds);
    }

    const efficiency =
      activeWorkers.reduce((sum, worker) => {
        const skillKey = definition.preferredJob ?? worker.job;
        return sum + (worker.skills[skillKey] ?? 1);
      }, 0) / activeWorkers.length;

    const preferredJob = definition.preferredJob;
    const jobMultiplier = preferredJob ? getMultiplier(jobMultipliers, preferredJob) : 1;
    produceOutputs(state, definition.outputPerWorker, activeWorkers.length, deltaSeconds, {
      efficiency,
      resourceMultipliers,
      jobMultiplier,
    });
  }

  trimToStorageCapacity(state, emit);
}
