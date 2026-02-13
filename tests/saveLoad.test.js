import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../src/game/state.js';
import { deserializeState, isLikelyValidState, serializeState } from '../src/persistence/saveLoad.js';

test('state can be serialized and deserialized', () => {
  const state = createInitialState();
  state.resources.food = 77;
  state.research.completed.push('masonry');

  const serialized = serializeState(state);
  const parsed = deserializeState(serialized);

  assert.equal(parsed.resources.food, 77);
  assert.ok(parsed.research.completed.includes('masonry'));
  assert.equal(isLikelyValidState(parsed), true);
});

test('isLikelyValidState rejects malformed payload', () => {
  assert.equal(isLikelyValidState(null), false);
  assert.equal(isLikelyValidState({}), false);
});
