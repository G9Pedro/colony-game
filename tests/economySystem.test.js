import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../src/game/state.js';
import { runEconomySystem } from '../src/systems/economySystem.js';

test('economy system produces resources from assigned workers', () => {
  const state = createInitialState();
  state.resources.food = 15;
  state.resources.wood = 20;
  state.resources.stone = 10;
  state.resources.iron = 4;
  state.resources.tools = 2;
  state.resources.medicine = 1;
  state.resources.knowledge = 0;

  const farm = state.buildings.find((building) => building.type === 'farm');
  const farmer = state.colonists[0];

  farmer.job = 'farmer';
  farmer.task = 'Working';
  farmer.assignedBuildingId = farm.id;
  farmer.skills.farmer = 1.2;

  const before = state.resources.food;
  runEconomySystem({
    state,
    deltaSeconds: 5,
    emit: () => {},
  });

  assert.ok(state.resources.food > before);
});

test('economy system trims overflow when storage is exceeded', () => {
  const state = createInitialState();
  state.resources.food = 400;
  state.resources.wood = 500;
  state.resources.stone = 300;
  state.resources.iron = 200;
  state.resources.tools = 180;
  state.resources.medicine = 100;
  state.resources.knowledge = 20;

  let emitted = false;
  runEconomySystem({
    state,
    deltaSeconds: 1,
    emit: () => {
      emitted = true;
    },
  });

  const total = Object.values(state.resources).reduce((sum, value) => sum + value, 0);
  assert.ok(total <= state.rules.baseStorageCapacity + 1);
  assert.equal(emitted, true);
});

test('economy system applies production resource and job multipliers', () => {
  const baselineState = createInitialState({ seed: 'economy-multiplier-test' });
  baselineState.resources.food = 15;
  baselineState.resources.wood = 20;
  baselineState.resources.stone = 10;
  baselineState.resources.iron = 4;
  baselineState.resources.tools = 2;
  baselineState.resources.medicine = 1;
  baselineState.resources.knowledge = 0;

  const boostedState = createInitialState({ seed: 'economy-multiplier-test' });
  boostedState.resources.food = 15;
  boostedState.resources.wood = 20;
  boostedState.resources.stone = 10;
  boostedState.resources.iron = 4;
  boostedState.resources.tools = 2;
  boostedState.resources.medicine = 1;
  boostedState.resources.knowledge = 0;
  boostedState.rules.productionResourceMultipliers.food = 1.5;
  boostedState.rules.productionJobMultipliers.farmer = 2;

  const baselineFarm = baselineState.buildings.find((building) => building.type === 'farm');
  const boostedFarm = boostedState.buildings.find((building) => building.type === 'farm');
  const baselineFarmer = baselineState.colonists[0];
  const boostedFarmer = boostedState.colonists[0];

  baselineFarmer.job = 'farmer';
  baselineFarmer.task = 'Working';
  baselineFarmer.assignedBuildingId = baselineFarm.id;
  baselineFarmer.skills.farmer = 1.2;

  boostedFarmer.job = 'farmer';
  boostedFarmer.task = 'Working';
  boostedFarmer.assignedBuildingId = boostedFarm.id;
  boostedFarmer.skills.farmer = 1.2;

  const baselineBefore = baselineState.resources.food;
  const boostedBefore = boostedState.resources.food;

  runEconomySystem({
    state: baselineState,
    deltaSeconds: 5,
    emit: () => {},
  });
  runEconomySystem({
    state: boostedState,
    deltaSeconds: 5,
    emit: () => {},
  });

  const baselineGain = baselineState.resources.food - baselineBefore;
  const boostedGain = boostedState.resources.food - boostedBefore;
  assert.ok(Math.abs(boostedGain - baselineGain * 3) < 1e-9);
});
