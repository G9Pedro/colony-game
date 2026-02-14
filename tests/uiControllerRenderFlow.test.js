import test from 'node:test';
import assert from 'node:assert/strict';
import { runUiControllerRender } from '../src/ui/uiControllerRenderFlow.js';

function createGameUIMock() {
  const calls = [];
  let buildListConfig = null;
  let researchStart = null;
  return {
    calls,
    getBuildListConfig: () => buildListConfig,
    getResearchStart: () => researchStart,
    renderTopState: (...args) => calls.push({ method: 'renderTopState', args }),
    renderSpeedButtons: (...args) => calls.push({ method: 'renderSpeedButtons', args }),
    renderResourceBar: (...args) => calls.push({ method: 'renderResourceBar', args }),
    renderBuildList: (config) => {
      buildListConfig = config;
      calls.push({ method: 'renderBuildList', args: [config] });
    },
    renderResearch: (state, getAvailableResearch, onStartResearch) => {
      researchStart = onStartResearch;
      calls.push({ method: 'renderResearch', args: [state, getAvailableResearch] });
    },
    renderObjectives: (...args) => calls.push({ method: 'renderObjectives', args }),
    renderConstructionQueue: (...args) => calls.push({ method: 'renderConstructionQueue', args }),
    renderColonists: (...args) => calls.push({ method: 'renderColonists', args }),
    renderRunStats: (...args) => calls.push({ method: 'renderRunStats', args }),
    renderSelection: (...args) => calls.push({ method: 'renderSelection', args }),
  };
}

test('runUiControllerRender orchestrates game panels and HUD mapping', () => {
  const state = { id: 'state' };
  const selectedEntity = { type: 'building', id: 'hut-1' };
  const gameUI = createGameUIMock();
  const minimapCalls = [];
  const hudCalls = [];
  const bannerCalls = [];
  const engineCalls = [];

  const hudState = runUiControllerRender({
    state,
    selectedBuildType: 'hut',
    selectedEntity,
    engine: {
      setSelectedBuildingType: (value) => engineCalls.push({ method: 'setSelectedBuildingType', value }),
      setSelectedCategory: (value) => engineCalls.push({ method: 'setSelectedCategory', value }),
      beginResearch: () => ({ ok: true }),
    },
    renderer: {
      getCameraState: () => ({ zoom: 1 }),
    },
    elements: { id: 'elements' },
    gameUI,
    minimap: {
      render: (...args) => minimapCalls.push(args),
    },
    pushNotification: () => {
      throw new Error('should not notify in success branch');
    },
    setSelectedBuildType: (value) => engineCalls.push({ method: 'setSelectedBuildType', value }),
    showBanner: (message) => bannerCalls.push({ method: 'showBanner', message }),
    hideBanner: () => bannerCalls.push({ method: 'hideBanner' }),
    dependencies: {
      buildTopSummaryFn: () => ({
        populationText: '10/20',
        moraleText: '88%',
        storageText: '50/100',
      }),
      buildingCategories: ['housing'],
      toggleBuildSelectionFn: (_current, next) => `${next}-selected`,
      isBuildingUnlockedFn: () => true,
      getAvailableResearchFn: () => ['r1'],
      getObjectiveDefinitionsFn: () => ['o1'],
      getObjectiveRewardMultiplierFn: () => 1.2,
      formatObjectiveRewardFn: () => 'reward',
      getCurrentObjectiveIdsFn: () => ['o1'],
      buildUiControllerHudStateFn: () => ({
        scenarioId: 'standard',
        balanceProfileId: 'default',
        rendererMode: 'isometric',
        renderStatsLabel: '60 fps',
        bannerMessage: 'Paused',
      }),
      applyHudStateToElementsFn: (elements, hudState) => hudCalls.push({ elements, hudState }),
      syncBannerStateFn: ({ bannerMessage, showBanner, hideBanner }) => {
        if (bannerMessage) {
          showBanner(bannerMessage);
        } else {
          hideBanner();
        }
      },
    },
  });

  assert.deepEqual(hudState, {
    scenarioId: 'standard',
    balanceProfileId: 'default',
    rendererMode: 'isometric',
    renderStatsLabel: '60 fps',
    bannerMessage: 'Paused',
  });
  assert.equal(gameUI.calls[0].method, 'renderTopState');
  assert.equal(gameUI.calls[0].args[1].populationText, '10/20');
  assert.equal(gameUI.calls.at(-1).method, 'renderSelection');
  assert.deepEqual(minimapCalls, [[state, { zoom: 1 }, selectedEntity]]);
  assert.equal(hudCalls.length, 1);
  assert.deepEqual(bannerCalls, [{ method: 'showBanner', message: 'Paused' }]);

  const buildListConfig = gameUI.getBuildListConfig();
  buildListConfig.onToggleBuildType('farm');
  buildListConfig.onSelectCategory('housing');
  assert.deepEqual(engineCalls, [
    { method: 'setSelectedBuildType', value: 'farm-selected' },
    { method: 'setSelectedBuildingType', value: 'farm-selected' },
    { method: 'setSelectedCategory', value: 'housing' },
  ]);
});

test('runUiControllerRender pushes notification when research cannot start', () => {
  const gameUI = createGameUIMock();
  const notifications = [];
  runUiControllerRender({
    state: {},
    selectedBuildType: null,
    selectedEntity: null,
    engine: {
      setSelectedBuildingType: () => {},
      setSelectedCategory: () => {},
      beginResearch: () => ({ ok: false, message: 'Need knowledge' }),
    },
    renderer: null,
    elements: {},
    gameUI,
    minimap: { render: () => {} },
    pushNotification: (payload) => notifications.push(payload),
    setSelectedBuildType: () => {},
    showBanner: () => {},
    hideBanner: () => {},
    dependencies: {
      buildTopSummaryFn: () => ({
        populationText: '0',
        moraleText: '0',
        storageText: '0',
      }),
      buildingCategories: [],
      toggleBuildSelectionFn: () => null,
      isBuildingUnlockedFn: () => true,
      getAvailableResearchFn: () => [],
      getObjectiveDefinitionsFn: () => [],
      getObjectiveRewardMultiplierFn: () => 1,
      formatObjectiveRewardFn: () => '',
      getCurrentObjectiveIdsFn: () => [],
      buildUiControllerHudStateFn: () => ({
        scenarioId: '',
        balanceProfileId: '',
        rendererMode: 'isometric',
        renderStatsLabel: '',
        bannerMessage: '',
      }),
      applyHudStateToElementsFn: () => {},
      syncBannerStateFn: () => {},
    },
  });

  gameUI.getResearchStart()('research-1');
  assert.deepEqual(notifications, [{ kind: 'error', message: 'Need knowledge' }]);
});

