import { BUILDING_DEFINITIONS } from '../content/buildings.js';
import { getPopulationCapacity } from '../game/selectors.js';
import { nextRandom } from '../game/random.js';

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function getJobPriority(state, job) {
  const population = state.colonists.filter((colonist) => colonist.alive).length;
  const foodTarget = Math.max(80, population * 22);

  const priorities = {
    farmer: state.resources.food < foodTarget ? 10 : 5,
    lumberjack: state.resources.wood < 90 ? 7 : 4,
    miner: state.resources.stone < 70 || state.resources.iron < 40 ? 8 : 3,
    artisan: state.resources.tools < 20 ? 8 : 2,
    scholar: state.resources.knowledge < 140 ? 7 : 3,
    medic: state.resources.medicine < 12 ? 6 : 3,
  };

  if (state.constructionQueue.length > 0) {
    priorities.builder = 9;
  } else {
    priorities.builder = 3;
  }

  const basePriority = priorities[job] ?? 1;
  const multiplier = state.rules?.jobPriorityMultipliers?.[job];
  if (typeof multiplier !== 'number' || !Number.isFinite(multiplier) || multiplier <= 0) {
    return basePriority;
  }
  return basePriority * multiplier;
}

function reassignJobs(state) {
  const aliveColonists = state.colonists.filter((colonist) => colonist.alive);
  for (const colonist of aliveColonists) {
    colonist.assignedBuildingId = null;
    colonist.job = 'laborer';
  }

  const slots = [];
  for (const building of state.buildings) {
    const definition = BUILDING_DEFINITIONS[building.type];
    if (!definition.workerSlots || !definition.preferredJob) {
      continue;
    }
    for (let slot = 0; slot < definition.workerSlots; slot += 1) {
      slots.push({
        buildingId: building.id,
        job: definition.preferredJob,
        priority: getJobPriority(state, definition.preferredJob),
      });
    }
  }

  slots.sort((a, b) => b.priority - a.priority);

  for (const slot of slots) {
    const candidates = aliveColonists.filter(
      (colonist) =>
        !colonist.assignedBuildingId &&
        colonist.needs.health > 20 &&
        colonist.needs.rest > 12 &&
        colonist.needs.hunger > 10,
    );
    if (candidates.length === 0) {
      continue;
    }

    candidates.sort((a, b) => {
      const affinityA = a.affinity === slot.job ? 0.3 : 0;
      const affinityB = b.affinity === slot.job ? 0.3 : 0;
      const skillA = a.skills[slot.job] ?? 1;
      const skillB = b.skills[slot.job] ?? 1;
      return skillB + affinityB - (skillA + affinityA);
    });

    const chosen = candidates[0];
    chosen.assignedBuildingId = slot.buildingId;
    chosen.job = slot.job;
  }

  if (state.constructionQueue.length > 0) {
    const freeColonists = aliveColonists.filter(
      (colonist) => !colonist.assignedBuildingId && colonist.needs.health > 20 && colonist.needs.rest > 12,
    );
    const desiredBuilders = Math.min(4, Math.ceil(state.constructionQueue.length * 1.5));
    for (let index = 0; index < Math.min(desiredBuilders, freeColonists.length); index += 1) {
      freeColonists[index].job = 'builder';
    }
  }
}

function updateColonistMovement(state, colonist, deltaSeconds) {
  const assignedBuilding = colonist.assignedBuildingId
    ? state.buildings.find((building) => building.id === colonist.assignedBuildingId)
    : null;

  if (assignedBuilding && nextRandom(state) < 0.035) {
    colonist.position.targetX = assignedBuilding.x + (nextRandom(state) - 0.5) * 1.8;
    colonist.position.targetZ = assignedBuilding.z + (nextRandom(state) - 0.5) * 1.8;
  } else if (!assignedBuilding && nextRandom(state) < 0.02) {
    colonist.position.targetX = (nextRandom(state) - 0.5) * 20;
    colonist.position.targetZ = (nextRandom(state) - 0.5) * 20;
  }

  const dx = colonist.position.targetX - colonist.position.x;
  const dz = colonist.position.targetZ - colonist.position.z;
  const distance = Math.hypot(dx, dz);

  if (distance < 0.15) {
    return;
  }

  const speed = 1.5 * deltaSeconds;
  colonist.position.x += (dx / distance) * Math.min(speed, distance);
  colonist.position.z += (dz / distance) * Math.min(speed, distance);
}

function consumeFood(state, colonist, deltaSeconds) {
  if (colonist.needs.hunger >= 88 || state.resources.food <= 0) {
    return;
  }
  const meal = Math.min(state.resources.food, deltaSeconds * 1.1);
  state.resources.food -= meal;
  colonist.needs.hunger = clamp(colonist.needs.hunger + meal * 18);
}

function consumeMedicine(state, colonist, deltaSeconds) {
  if (colonist.needs.health >= 65 || state.resources.medicine <= 0) {
    return;
  }
  const medicine = Math.min(state.resources.medicine, deltaSeconds * 0.08);
  state.resources.medicine -= medicine;
  colonist.needs.health = clamp(colonist.needs.health + medicine * 70);
}

function getMoraleBonusFromBuildings(state) {
  return state.buildings.reduce((bonus, building) => {
    const definition = BUILDING_DEFINITIONS[building.type];
    return bonus + (definition.moraleBonus ?? 0);
  }, 0);
}

export function runColonistSystem(context) {
  const { state, deltaSeconds, emit } = context;
  reassignJobs(state);
  const needDecayMultiplier = state.rules?.needDecayMultiplier ?? 1;
  const starvationDamageMultiplier = state.rules?.starvationHealthDamageMultiplier ?? 1;
  const restDamageMultiplier = state.rules?.restHealthDamageMultiplier ?? 1;
  const moralePenaltyMultiplier = state.rules?.moralePenaltyMultiplier ?? 1;
  const moraleBonus = getMoraleBonusFromBuildings(state) * 0.02;
  const alivePopulation = state.colonists.filter((colonist) => colonist.alive).length;
  const populationCap = getPopulationCapacity(state);
  const overcrowded = alivePopulation > populationCap;

  for (const colonist of state.colonists) {
    if (!colonist.alive) {
      continue;
    }

    const isWorking = colonist.job !== 'laborer' || state.constructionQueue.length > 0;
    colonist.task = isWorking ? 'Working' : 'Idle';

    colonist.needs.hunger = clamp(colonist.needs.hunger - deltaSeconds * 0.9 * needDecayMultiplier);
    colonist.needs.rest = clamp(
      colonist.needs.rest - deltaSeconds * (isWorking ? 0.62 : 0.25) * needDecayMultiplier,
    );
    colonist.needs.morale = clamp(
      colonist.needs.morale - deltaSeconds * 0.22 * moralePenaltyMultiplier + moraleBonus,
    );

    if (!isWorking) {
      colonist.needs.rest = clamp(colonist.needs.rest + deltaSeconds * 1.1);
      colonist.task = 'Resting';
      if (colonist.needs.hunger > 60 && colonist.needs.health > 40) {
        const forageEfficiency = colonist.trait === 'Resourceful' ? 1.25 : 1;
        state.resources.food += deltaSeconds * 0.035 * forageEfficiency;
        state.resources.wood += deltaSeconds * 0.02 * forageEfficiency;
      }
    }

    if (overcrowded) {
      colonist.needs.morale = clamp(colonist.needs.morale - deltaSeconds * 0.65 * moralePenaltyMultiplier);
    }

    consumeFood(state, colonist, deltaSeconds);
    consumeMedicine(state, colonist, deltaSeconds);

    if (colonist.needs.hunger <= 0) {
      colonist.needs.health = clamp(
        colonist.needs.health - deltaSeconds * 4.5 * starvationDamageMultiplier,
      );
      colonist.needs.morale = clamp(colonist.needs.morale - deltaSeconds * 1.5 * moralePenaltyMultiplier);
    }
    if (colonist.needs.rest <= 6) {
      colonist.needs.health = clamp(colonist.needs.health - deltaSeconds * 1.8 * restDamageMultiplier);
      colonist.needs.morale = clamp(colonist.needs.morale - deltaSeconds * 1.1 * moralePenaltyMultiplier);
    }
    if (colonist.needs.morale <= 8) {
      colonist.needs.health = clamp(colonist.needs.health - deltaSeconds * 1.2 * moralePenaltyMultiplier);
    }

    if (colonist.task === 'Working' && colonist.job !== 'laborer') {
      colonist.skills[colonist.job] = clamp((colonist.skills[colonist.job] ?? 1) + deltaSeconds * 0.015, 0, 3.5);
    }

    updateColonistMovement(state, colonist, deltaSeconds);

    if (colonist.needs.health <= 0) {
      colonist.alive = false;
      colonist.task = 'Dead';
      colonist.assignedBuildingId = null;
      state.metrics.deaths += 1;
      emit('colonist-death', {
        kind: 'error',
        message: `${colonist.name} has died.`,
      });
    }
  }
}
