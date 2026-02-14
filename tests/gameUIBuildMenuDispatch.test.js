import test from 'node:test';
import assert from 'node:assert/strict';
import { dispatchGameUIBuildMenu } from '../src/ui/gameUIBuildMenuDispatch.js';

function createGameUIStub() {
  return {
    el: {
      buildCategories: {},
      buildList: {},
    },
    buildingDefinitions: { hut: { id: 'hut' } },
    spriteFactory: { id: 'sprite-factory' },
  };
}

test('dispatchGameUIBuildMenu renders categories and cards with mapped dependencies', () => {
  const gameUI = createGameUIStub();
  const state = { selectedCategory: 'housing' };
  const categories = [{ id: 'housing' }];
  const calls = [];
  const onSelectCategory = () => {};
  const onToggleBuildType = () => {};
  const isBuildingUnlocked = () => true;
  const sentinels = {
    categoryRowsBuilder: () => [],
    buildRowsBuilder: () => [],
    categoryButtonBuilder: () => ({}),
    buildCardBuilder: () => ({}),
    costFormatter: () => '',
    cardStateResolver: () => ({}),
  };

  dispatchGameUIBuildMenu(
    gameUI,
    {
      state,
      selectedBuildType: 'hut',
      onToggleBuildType,
      onSelectCategory,
      categories,
      isBuildingUnlocked,
    },
    {
      ...sentinels,
      renderCategories: (payload) => calls.push({ method: 'renderCategories', payload }),
      renderCards: (payload) => calls.push({ method: 'renderCards', payload }),
    },
  );

  assert.equal(calls.length, 2);
  assert.deepEqual(calls[0], {
    method: 'renderCategories',
    payload: {
      elements: gameUI.el,
      categories,
      selectedCategory: 'housing',
      buildCategoryPillRows: sentinels.categoryRowsBuilder,
      createBuildCategoryButton: sentinels.categoryButtonBuilder,
      onSelectCategory,
    },
  });
  assert.deepEqual(calls[1], {
    method: 'renderCards',
    payload: {
      elements: gameUI.el,
      state,
      selectedBuildType: 'hut',
      isBuildingUnlocked,
      buildingDefinitions: gameUI.buildingDefinitions,
      formatCost: sentinels.costFormatter,
      getBuildingCardState: sentinels.cardStateResolver,
      buildBuildCardRows: sentinels.buildRowsBuilder,
      spriteFactory: gameUI.spriteFactory,
      createBuildCardElement: sentinels.buildCardBuilder,
      onToggleBuildType,
    },
  });
});

