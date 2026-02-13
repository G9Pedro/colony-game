import test from 'node:test';
import assert from 'node:assert/strict';
import { GameEngine } from '../src/game/gameEngine.js';
import { createInitialState } from '../src/game/state.js';

test('loadState returns error when migrated save violates runtime invariants', () => {
  const engine = new GameEngine({ seed: 'load-seed' });
  const state = createInitialState({ seed: 'load-seed' });
  state.buildings[1].id = state.buildings[0].id;

  const result = engine.loadState(state);
  assert.equal(result.ok, false);
  assert.ok(result.message.includes('duplicate building id'));
});

test('loadState accepts valid state and updates engine options', () => {
  const engine = new GameEngine({ scenarioId: 'frontier', seed: 'load-seed' });
  const state = createInitialState({ scenarioId: 'harsh', seed: 'import-seed' });

  const result = engine.loadState(state);
  assert.equal(result.ok, true);
  assert.equal(engine.state.scenarioId, 'harsh');
  assert.equal(engine.state.rngSeed, 'import-seed');
});
