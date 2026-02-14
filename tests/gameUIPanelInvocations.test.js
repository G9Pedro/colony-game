import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildGameUIColonistPanelInvocation,
  buildGameUIConstructionQueueInvocation,
  buildGameUIObjectivesPanelInvocation,
  buildGameUIResearchPanelInvocation,
  buildGameUIRunStatsPanelInvocation,
  buildGameUISelectionPanelInvocation,
} from '../src/ui/gameUIPanelInvocations.js';

function createGameUIStub() {
  return {
    el: {
      researchCurrent: { id: 'research-current' },
      researchList: { id: 'research-list' },
      constructionList: { id: 'construction-list' },
      colonistList: { id: 'colonist-list' },
      objectivesList: { id: 'objectives-list' },
      hintBadge: { id: 'hint-badge' },
      metricsSummary: { id: 'metrics-summary' },
      runHistory: { id: 'run-history' },
      infoPanelTitle: { id: 'info-title' },
      infoPanelBody: { id: 'info-body' },
    },
    researchDefinitions: [{ id: 'research' }],
    buildingDefinitions: [{ id: 'hut' }],
  };
}

test('buildGameUIResearchPanelInvocation maps research panel payload', () => {
  const gameUI = createGameUIStub();
  const state = { tick: 2 };
  const getAvailableResearch = () => [];
  const onStartResearch = () => {};
  assert.deepEqual(
    buildGameUIResearchPanelInvocation(gameUI, state, getAvailableResearch, onStartResearch),
    {
      currentElement: gameUI.el.researchCurrent,
      listElement: gameUI.el.researchList,
      state,
      researchDefinitions: gameUI.researchDefinitions,
      getAvailableResearch,
      onStartResearch,
    },
  );
});

test('game ui panel invocation builders map queue, colonists, objectives, run stats, and selection', () => {
  const gameUI = createGameUIStub();
  const state = { day: 5 };
  const objectives = [{ id: 'obj' }];
  const rewardMultiplier = 1.4;
  const formatObjectiveReward = () => 'reward';
  const getCurrentObjectiveIds = () => ['obj'];
  const selection = { type: 'building', id: 5 };

  assert.deepEqual(buildGameUIConstructionQueueInvocation(gameUI, state), {
    listElement: gameUI.el.constructionList,
    state,
    buildingDefinitions: gameUI.buildingDefinitions,
  });
  assert.deepEqual(buildGameUIColonistPanelInvocation(gameUI, state), {
    listElement: gameUI.el.colonistList,
    state,
    limit: 18,
  });
  assert.deepEqual(
    buildGameUIObjectivesPanelInvocation(
      gameUI,
      state,
      objectives,
      rewardMultiplier,
      formatObjectiveReward,
      getCurrentObjectiveIds,
    ),
    {
      listElement: gameUI.el.objectivesList,
      hintElement: gameUI.el.hintBadge,
      state,
      objectives,
      rewardMultiplier,
      formatObjectiveReward,
      getCurrentObjectiveIds,
    },
  );
  assert.deepEqual(buildGameUIRunStatsPanelInvocation(gameUI, state), {
    metricsElement: gameUI.el.metricsSummary,
    historyElement: gameUI.el.runHistory,
    state,
    historyLimit: 3,
  });
  assert.deepEqual(buildGameUISelectionPanelInvocation(gameUI, selection, state), {
    titleElement: gameUI.el.infoPanelTitle,
    bodyElement: gameUI.el.infoPanelBody,
    selection,
    state,
    buildingDefinitions: gameUI.buildingDefinitions,
  });
});

