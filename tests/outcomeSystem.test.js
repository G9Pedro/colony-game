import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../src/game/state.js';
import { runOutcomeSystem } from '../src/systems/outcomeSystem.js';

test('outcome system records run summary on total colony loss', () => {
  const state = createInitialState({ seed: 'outcome-seed' });
  state.colonists.forEach((colonist) => {
    colonist.alive = false;
  });

  let gameOverMessage = '';
  runOutcomeSystem({
    state,
    deltaSeconds: 0.2,
    emit: (_eventName, payload) => {
      gameOverMessage = payload.message;
    },
  });

  assert.equal(state.status, 'lost');
  assert.equal(state.runSummaryHistory.length, 1);
  assert.equal(state.runSummaryHistory[0].outcome, 'lost');
  assert.equal(state.runSummaryHistory[0].balanceProfileId, 'standard');
  assert.ok(gameOverMessage.includes('colony has fallen'));
});

test('outcome system tracks peak population metric while playing', () => {
  const state = createInitialState({ scenarioId: 'frontier', seed: 'outcome-seed' });
  state.metrics.peakPopulation = 0;

  runOutcomeSystem({
    state,
    deltaSeconds: 0.2,
    emit: () => {},
  });

  const alivePopulation = state.colonists.filter((colonist) => colonist.alive).length;
  assert.equal(state.metrics.peakPopulation, alivePopulation);
  assert.equal(state.status, 'playing');
});
