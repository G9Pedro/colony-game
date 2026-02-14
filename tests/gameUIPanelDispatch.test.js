import test from 'node:test';
import assert from 'node:assert/strict';
import {
  dispatchGameUIColonistPanel,
  dispatchGameUIConstructionQueuePanel,
  dispatchGameUIObjectivesPanel,
  dispatchGameUIResearchPanel,
  dispatchGameUIRunStatsPanel,
  dispatchGameUISelectionPanel,
} from '../src/ui/gameUIPanelDispatch.js';

function createDispatchHarness(payload = { id: 'invocation' }) {
  const calls = [];
  return {
    calls,
    buildInvocation: (...args) => {
      calls.push({ method: 'buildInvocation', args });
      return payload;
    },
    renderPanel: (invocation) => {
      calls.push({ method: 'renderPanel', invocation });
    },
  };
}

test('dispatchGameUIResearchPanel builds invocation and renders panel', () => {
  const harness = createDispatchHarness();
  const gameUI = { id: 'ui' };
  const state = { id: 'state' };
  const getAvailableResearch = () => [];
  const onStartResearch = () => {};

  dispatchGameUIResearchPanel(gameUI, state, getAvailableResearch, onStartResearch, harness);

  assert.deepEqual(harness.calls, [
    { method: 'buildInvocation', args: [gameUI, state, getAvailableResearch, onStartResearch] },
    { method: 'renderPanel', invocation: { id: 'invocation' } },
  ]);
});

test('dispatchGameUIConstructionQueuePanel builds invocation and renders panel', () => {
  const harness = createDispatchHarness();
  const gameUI = { id: 'ui' };
  const state = { id: 'state' };

  dispatchGameUIConstructionQueuePanel(gameUI, state, harness);

  assert.deepEqual(harness.calls, [
    { method: 'buildInvocation', args: [gameUI, state] },
    { method: 'renderPanel', invocation: { id: 'invocation' } },
  ]);
});

test('dispatchGameUIColonistPanel builds invocation and renders panel', () => {
  const harness = createDispatchHarness();
  const gameUI = { id: 'ui' };
  const state = { id: 'state' };

  dispatchGameUIColonistPanel(gameUI, state, harness);

  assert.deepEqual(harness.calls, [
    { method: 'buildInvocation', args: [gameUI, state] },
    { method: 'renderPanel', invocation: { id: 'invocation' } },
  ]);
});

test('dispatchGameUIObjectivesPanel builds invocation and renders panel', () => {
  const harness = createDispatchHarness();
  const gameUI = { id: 'ui' };
  const state = { id: 'state' };
  const objectives = [{ id: 'o1' }];
  const rewardMultiplier = 2;
  const formatObjectiveReward = () => {};
  const getCurrentObjectiveIds = () => ['o1'];

  dispatchGameUIObjectivesPanel(
    gameUI,
    state,
    objectives,
    rewardMultiplier,
    formatObjectiveReward,
    getCurrentObjectiveIds,
    harness,
  );

  assert.deepEqual(harness.calls, [
    {
      method: 'buildInvocation',
      args: [gameUI, state, objectives, rewardMultiplier, formatObjectiveReward, getCurrentObjectiveIds],
    },
    { method: 'renderPanel', invocation: { id: 'invocation' } },
  ]);
});

test('dispatchGameUIRunStatsPanel builds invocation and renders panel', () => {
  const harness = createDispatchHarness();
  const gameUI = { id: 'ui' };
  const state = { id: 'state' };

  dispatchGameUIRunStatsPanel(gameUI, state, harness);

  assert.deepEqual(harness.calls, [
    { method: 'buildInvocation', args: [gameUI, state] },
    { method: 'renderPanel', invocation: { id: 'invocation' } },
  ]);
});

test('dispatchGameUISelectionPanel builds invocation and renders panel', () => {
  const harness = createDispatchHarness();
  const gameUI = { id: 'ui' };
  const selection = { id: 'selection' };
  const state = { id: 'state' };

  dispatchGameUISelectionPanel(gameUI, selection, state, harness);

  assert.deepEqual(harness.calls, [
    { method: 'buildInvocation', args: [gameUI, selection, state] },
    { method: 'renderPanel', invocation: { id: 'invocation' } },
  ]);
});

