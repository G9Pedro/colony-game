import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../src/game/state.js';
import { formatObjectiveReward, getCurrentObjectiveIds, getObjectiveDefinitions, runObjectiveSystem } from '../src/systems/objectiveSystem.js';

test('objective system marks masonry objective complete after research', () => {
  const state = createInitialState({ seed: 'objective-seed' });
  state.research.completed.push('masonry');

  const emitted = [];
  runObjectiveSystem({
    state,
    emit: (_eventName, payload) => emitted.push(payload.message),
  });

  assert.ok(state.objectives.completed.includes('research-masonry'));
  assert.ok(emitted.some((message) => message.includes('Research Masonry')));
});

test('objective completions are emitted once', () => {
  const state = createInitialState({ seed: 'objective-seed' });
  state.resources.food = 200;
  state.buildings.push({
    id: 'building-extra-farm',
    type: 'farm',
    x: 10,
    z: 10,
    size: [3.8, 0.9, 3.8],
    createdAt: 0,
    isOperational: true,
    health: 100,
    workersAssigned: 0,
  });

  let emitCount = 0;
  const emit = () => {
    emitCount += 1;
  };

  runObjectiveSystem({ state, emit });
  runObjectiveSystem({ state, emit });

  const remaining = getCurrentObjectiveIds(state);
  assert.ok(!remaining.includes('food-security'));
  assert.equal(emitCount, 1);
});

test('current objective list shrinks as objectives complete', () => {
  const state = createInitialState({ seed: 'objective-seed' });
  const before = getCurrentObjectiveIds(state);
  state.research.completed.push('masonry');
  runObjectiveSystem({
    state,
    emit: () => {},
  });
  const after = getCurrentObjectiveIds(state);

  assert.ok(before.includes('research-masonry'));
  assert.ok(!after.includes('research-masonry'));
  assert.ok(after.length < before.length);
});

test('objective completion grants configured rewards', () => {
  const state = createInitialState({ seed: 'objective-seed' });
  state.research.completed.push('masonry');
  state.resources.wood = 0;
  state.resources.stone = 0;
  state.colonists.forEach((colonist) => {
    colonist.needs.morale = 50;
  });

  runObjectiveSystem({
    state,
    emit: () => {},
  });

  assert.ok(state.objectives.completed.includes('research-masonry'));
  assert.ok(state.resources.wood >= 25);
  assert.ok(state.resources.stone >= 15);
  assert.ok(state.colonists.every((colonist) => colonist.needs.morale >= 51));
});

test('formatObjectiveReward returns player-readable text', () => {
  const objective = getObjectiveDefinitions().find((item) => item.id === 'research-masonry');
  const description = formatObjectiveReward(objective);
  assert.ok(description.includes('25 wood'));
  assert.ok(description.includes('15 stone'));
  assert.ok(description.includes('+1 morale'));
});

test('objective rewards scale by scenario reward multiplier', () => {
  const harshState = createInitialState({ scenarioId: 'harsh', seed: 'objective-seed' });
  harshState.research.completed.push('masonry');
  harshState.resources.wood = 0;
  harshState.resources.stone = 0;
  runObjectiveSystem({
    state: harshState,
    emit: () => {},
  });

  const prosperousState = createInitialState({ scenarioId: 'prosperous', seed: 'objective-seed' });
  prosperousState.research.completed.push('masonry');
  prosperousState.resources.wood = 0;
  prosperousState.resources.stone = 0;
  runObjectiveSystem({
    state: prosperousState,
    emit: () => {},
  });

  assert.ok(harshState.resources.wood > prosperousState.resources.wood);
  assert.ok(harshState.resources.stone > prosperousState.resources.stone);
});
