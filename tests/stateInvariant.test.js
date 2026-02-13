import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../src/game/state.js';
import { validateRuntimeState } from '../src/game/stateInvariant.js';
import { GameEngine } from '../src/game/gameEngine.js';

test('validateRuntimeState accepts fresh initial state', () => {
  const state = createInitialState({ seed: 'invariant-seed' });
  const errors = validateRuntimeState(state);
  assert.equal(errors.length, 0);
});

test('validateRuntimeState catches negative resources and missing assignments', () => {
  const state = createInitialState({ seed: 'invariant-seed' });
  state.resources.food = -5;
  state.colonists[0].assignedBuildingId = 'missing-building';
  const errors = validateRuntimeState(state);

  assert.ok(errors.some((error) => error.includes('resource "food" dropped below zero')));
  assert.ok(errors.some((error) => error.includes('references missing building')));
});

test('GameEngine emits state-invalid and pauses on invariant violation', () => {
  const engine = new GameEngine({ seed: 'invariant-seed' });
  let errorMessage = '';
  engine.on('state-invalid', ({ message }) => {
    errorMessage = message;
  });

  engine.state.buildings[1].id = engine.state.buildings[0].id;
  engine.step(0.2);

  assert.equal(engine.state.paused, true);
  assert.equal(engine.state.debug.invariantViolations.length, 1);
  assert.ok(engine.state.debug.invariantViolations[0].message.includes('duplicate building id'));
  assert.ok(errorMessage.includes('State invariant violation'));
});
