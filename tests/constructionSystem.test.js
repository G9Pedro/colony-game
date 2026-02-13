import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../src/game/state.js';
import { queueConstruction, runConstructionSystem } from '../src/systems/constructionSystem.js';

test('queueConstruction deducts resources and adds queue item', () => {
  const state = createInitialState();
  const beforeWood = state.resources.wood;
  const result = queueConstruction(state, 'hut', 12, -12);

  assert.equal(result.ok, true);
  assert.equal(state.constructionQueue.length, 1);
  assert.ok(state.resources.wood < beforeWood);
});

test('runConstructionSystem completes building when progress reaches build time', () => {
  const state = createInitialState();
  const result = queueConstruction(state, 'hut', 14, -14);
  assert.equal(result.ok, true);

  state.colonists[0].job = 'builder';
  state.colonists[0].task = 'Working';
  state.colonists[1].job = 'builder';
  state.colonists[1].task = 'Working';

  let completed = false;
  for (let index = 0; index < 120; index += 1) {
    runConstructionSystem({
      state,
      deltaSeconds: 0.2,
      emit: () => {
        completed = true;
      },
    });
    if (state.constructionQueue.length === 0) {
      break;
    }
  }

  assert.equal(state.constructionQueue.length, 0);
  assert.equal(completed, true);
  assert.ok(state.buildings.some((building) => building.type === 'hut' && building.x === 14));
});
