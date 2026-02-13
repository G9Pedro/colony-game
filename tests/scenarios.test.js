import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../src/game/state.js';
import { GameEngine } from '../src/game/gameEngine.js';

test('prosperous scenario starts with stronger economy baseline', () => {
  const frontier = createInitialState({ scenarioId: 'frontier', seed: 'scenario-test' });
  const prosperous = createInitialState({ scenarioId: 'prosperous', seed: 'scenario-test' });

  assert.ok(prosperous.resources.food > frontier.resources.food);
  assert.ok(prosperous.resources.wood > frontier.resources.wood);
  assert.ok(prosperous.colonists.length > frontier.colonists.length);
  assert.ok(prosperous.rules.baseStorageCapacity > frontier.rules.baseStorageCapacity);
  assert.equal(prosperous.rules.productionResourceMultipliers.food, 1);
  assert.equal(prosperous.rules.productionJobMultipliers.farmer, 1);
  assert.equal(prosperous.rules.jobPriorityMultipliers.scholar, 1);
});

test('harsh scenario starts with reduced supplies and capacity', () => {
  const frontier = createInitialState({ scenarioId: 'frontier', seed: 'scenario-test' });
  const harsh = createInitialState({ scenarioId: 'harsh', seed: 'scenario-test' });

  assert.ok(harsh.resources.food < frontier.resources.food);
  assert.ok(harsh.colonists.length < frontier.colonists.length);
  assert.ok(harsh.rules.basePopulationCap < frontier.rules.basePopulationCap);
});

test('engine scenario switch resets state under selected scenario', () => {
  const engine = new GameEngine({ scenarioId: 'frontier', seed: 'seed-a' });
  const beforeCount = engine.state.colonists.length;
  engine.setScenario('prosperous');

  assert.equal(engine.state.scenarioId, 'prosperous');
  assert.ok(engine.state.colonists.length > beforeCount);
});
