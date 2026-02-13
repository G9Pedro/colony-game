import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../src/game/state.js';
import { canStartResearch, runResearchSystem, startResearch } from '../src/systems/researchSystem.js';

test('cannot start research without enough knowledge', () => {
  const state = createInitialState();
  state.resources.knowledge = 0;

  const result = canStartResearch(state, 'masonry');
  assert.equal(result.ok, false);
});

test('research progression completes and records technology', () => {
  const state = createInitialState();
  state.resources.knowledge = 500;
  state.colonists[0].job = 'scholar';
  state.colonists[0].task = 'Working';

  const started = startResearch(state, 'masonry');
  assert.equal(started.ok, true);

  let completed = false;
  for (let index = 0; index < 400; index += 1) {
    runResearchSystem({
      state,
      deltaSeconds: 0.2,
      emit: () => {
        completed = true;
      },
    });
    if (!state.research.current) {
      break;
    }
  }

  assert.equal(completed, true);
  assert.ok(state.research.completed.includes('masonry'));
  assert.equal(state.research.current, null);
});
