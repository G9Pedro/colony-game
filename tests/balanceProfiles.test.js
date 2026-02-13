import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../src/game/state.js';
import { runColonistSystem } from '../src/systems/colonistSystem.js';
import { runObjectiveSystem } from '../src/systems/objectiveSystem.js';

test('balance profiles change rule multipliers in initial state', () => {
  const forgiving = createInitialState({ balanceProfileId: 'forgiving', seed: 'balance-seed' });
  const brutal = createInitialState({ balanceProfileId: 'brutal', seed: 'balance-seed' });

  assert.ok(forgiving.rules.needDecayMultiplier < brutal.rules.needDecayMultiplier);
  assert.ok(forgiving.rules.objectiveRewardMultiplier > brutal.rules.objectiveRewardMultiplier);
  assert.equal(forgiving.balanceProfileId, 'forgiving');
  assert.equal(brutal.balanceProfileId, 'brutal');
});

test('brutal profile decays needs faster than forgiving profile', () => {
  const forgiving = createInitialState({ balanceProfileId: 'forgiving', seed: 'balance-seed' });
  const brutal = createInitialState({ balanceProfileId: 'brutal', seed: 'balance-seed' });

  runColonistSystem({
    state: forgiving,
    deltaSeconds: 2,
    emit: () => {},
  });
  runColonistSystem({
    state: brutal,
    deltaSeconds: 2,
    emit: () => {},
  });

  const forgivingHunger = forgiving.colonists[0].needs.hunger;
  const brutalHunger = brutal.colonists[0].needs.hunger;
  assert.ok(brutalHunger < forgivingHunger);
});

test('forgiving profile grants larger objective rewards than brutal', () => {
  const forgiving = createInitialState({ balanceProfileId: 'forgiving', seed: 'balance-seed' });
  const brutal = createInitialState({ balanceProfileId: 'brutal', seed: 'balance-seed' });

  forgiving.research.completed.push('masonry');
  brutal.research.completed.push('masonry');
  forgiving.resources.wood = 0;
  brutal.resources.wood = 0;

  runObjectiveSystem({ state: forgiving, emit: () => {} });
  runObjectiveSystem({ state: brutal, emit: () => {} });

  assert.ok(forgiving.resources.wood > brutal.resources.wood);
});
