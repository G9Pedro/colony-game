import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../src/game/state.js';
import { runColonistSystem } from '../src/systems/colonistSystem.js';

test('colonists lose health when starving', () => {
  const state = createInitialState();
  const colonist = state.colonists[0];
  state.resources.food = 0;
  colonist.needs.hunger = 0.5;
  const healthBefore = colonist.needs.health;

  for (let index = 0; index < 20; index += 1) {
    runColonistSystem({
      state,
      deltaSeconds: 0.5,
      emit: () => {},
    });
  }

  assert.ok(colonist.needs.health < healthBefore);
});

test('colonists consume food and recover hunger', () => {
  const state = createInitialState();
  const colonist = state.colonists[0];
  colonist.needs.hunger = 30;
  state.resources.food = 100;

  runColonistSystem({
    state,
    deltaSeconds: 1,
    emit: () => {},
  });

  assert.ok(colonist.needs.hunger > 30);
  assert.ok(state.resources.food < 100);
});
