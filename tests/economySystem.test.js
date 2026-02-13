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
