import { BUILDING_DEFINITIONS } from '../content/buildings.js';

const MIN_SPACING = 2.4;

export function hasEnoughResources(state, cost) {
  return Object.entries(cost).every(([resource, amount]) => (state.resources[resource] ?? 0) >= amount);
}

export function applyCost(state, cost) {
  for (const [resource, amount] of Object.entries(cost)) {
    state.resources[resource] = Math.max(0, (state.resources[resource] ?? 0) - amount);
  }
}

export function isPlacementValid(state, buildingId, x, z) {
  const definition = BUILDING_DEFINITIONS[buildingId];
  if (!definition) {
    return { valid: false, reason: 'Unknown building type.' };
  }

  const radius = state.maxWorldRadius;
  if (Math.abs(x) > radius || Math.abs(z) > radius) {
    return { valid: false, reason: 'Out of bounds.' };
  }

  const clearance = Math.max(definition.size[0], definition.size[2]) * 0.5 + MIN_SPACING;
  const existingObjects = [
    ...state.buildings.map((b) => ({ x: b.x, z: b.z, size: b.size })),
    ...state.constructionQueue.map((q) => ({
      x: q.x,
      z: q.z,
      size: BUILDING_DEFINITIONS[q.type].size,
    })),
  ];

  for (const object of existingObjects) {
    const objectClearance = Math.max(object.size[0], object.size[2]) * 0.5 + MIN_SPACING;
    const distance = Math.hypot(object.x - x, object.z - z);
    if (distance < clearance + objectClearance) {
      return { valid: false, reason: 'Too close to another structure.' };
    }
  }

  return { valid: true };
}

export function queueConstruction(state, buildingId, x, z) {
  const definition = BUILDING_DEFINITIONS[buildingId];
  if (!definition) {
    return { ok: false, message: 'Unknown structure.' };
  }

  const placement = isPlacementValid(state, buildingId, x, z);
  if (!placement.valid) {
    return { ok: false, message: placement.reason };
  }

  if (!hasEnoughResources(state, definition.cost)) {
    return { ok: false, message: 'Insufficient resources.' };
  }

  applyCost(state, definition.cost);
  const queueItem = {
    id: `construction-${state.nextEntityId++}`,
    type: buildingId,
    x,
    z,
    progress: 0,
    buildTime: definition.buildTime,
  };
  state.constructionQueue.push(queueItem);
  return { ok: true, queueItem };
}

export function runConstructionSystem(context) {
  const { state, deltaSeconds, emit } = context;
  if (state.constructionQueue.length === 0) {
    return;
  }

  const builders = state.colonists.filter(
    (colonist) => colonist.alive && colonist.job === 'builder' && colonist.task === 'Working',
  );
  const builderPower = Math.max(1, builders.length);
  const progressRatePerProject = (0.9 + builderPower * 0.45) / state.constructionQueue.length;

  const finished = [];
  for (const queueItem of state.constructionQueue) {
    queueItem.progress += deltaSeconds * progressRatePerProject;
    if (queueItem.progress >= queueItem.buildTime) {
      finished.push(queueItem);
    }
  }

  if (finished.length === 0) {
    return;
  }

  state.constructionQueue = state.constructionQueue.filter(
    (item) => !finished.some((complete) => complete.id === item.id),
  );

  for (const queueItem of finished) {
    const definition = BUILDING_DEFINITIONS[queueItem.type];
    state.buildings.push({
      id: `building-${state.nextEntityId++}`,
      type: queueItem.type,
      x: queueItem.x,
      z: queueItem.z,
      size: definition.size,
      createdAt: state.timeSeconds,
      isOperational: true,
      health: 100,
      workersAssigned: 0,
    });
    state.metrics.buildingsConstructed += 1;

    emit('construction-complete', {
      kind: 'success',
      message: `${definition.name} construction completed.`,
    });
  }
}
