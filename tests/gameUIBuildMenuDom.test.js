import test from 'node:test';
import assert from 'node:assert/strict';
import { renderGameUIBuildCards, renderGameUIBuildCategories } from '../src/ui/gameUIBuildMenuDom.js';

function createBuildMenuElements() {
  const appendedCategories = [];
  const appendedCards = [];
  return {
    elements: {
      buildCategories: {
        innerHTML: 'occupied',
        appendChild: (node) => appendedCategories.push(node),
      },
      buildList: {
        innerHTML: 'occupied',
        appendChild: (node) => appendedCards.push(node),
      },
    },
    appendedCategories,
    appendedCards,
  };
}

test('renderGameUIBuildCategories clears list and appends category buttons', () => {
  const { elements, appendedCategories } = createBuildMenuElements();
  const rows = [{ id: 'housing', label: 'Housing', active: true }, { id: 'food', label: 'Food', active: false }];
  const calls = [];

  renderGameUIBuildCategories({
    elements,
    categories: [{ id: 'housing' }, { id: 'food' }],
    selectedCategory: 'housing',
    buildCategoryPillRows: (categories, selectedCategory) => {
      calls.push({ categories, selectedCategory });
      return rows;
    },
    createBuildCategoryButton: ({ row, onSelectCategory }) => ({
      kind: 'category',
      rowId: row.id,
      onSelectCategory,
    }),
    onSelectCategory: () => {},
  });

  assert.equal(elements.buildCategories.innerHTML, '');
  assert.deepEqual(calls, [{ categories: [{ id: 'housing' }, { id: 'food' }], selectedCategory: 'housing' }]);
  assert.deepEqual(appendedCategories.map((entry) => entry.rowId), ['housing', 'food']);
});

test('renderGameUIBuildCards clears list and appends build cards with thumbnails', () => {
  const { elements, appendedCards } = createBuildMenuElements();
  const thumbCalls = [];
  const cardCalls = [];
  const rows = [
    { id: 'hut', name: 'Hut' },
    { id: 'farm', name: 'Farm' },
  ];
  const onToggleBuildType = () => {};

  renderGameUIBuildCards({
    elements,
    state: { selectedCategory: 'housing' },
    selectedBuildType: 'hut',
    buildingDefinitions: { hut: { id: 'hut' }, farm: { id: 'farm' } },
    isBuildingUnlocked: () => true,
    formatCost: () => 'cost',
    getBuildingCardState: () => ({ unlocked: true }),
    buildBuildCardRows: () => rows,
    spriteFactory: {
      getBuildingThumbnail: (id, size) => {
        thumbCalls.push({ id, size });
        return `${id}-${size}`;
      },
    },
    createBuildCardElement: ({ row, thumbnail, onToggleBuildType: onToggle }) => {
      cardCalls.push({ row, thumbnail, onToggle });
      return { kind: 'card', rowId: row.id };
    },
    onToggleBuildType,
  });

  assert.equal(elements.buildList.innerHTML, '');
  assert.deepEqual(thumbCalls, [
    { id: 'hut', size: 58 },
    { id: 'farm', size: 58 },
  ]);
  assert.deepEqual(cardCalls, [
    { row: rows[0], thumbnail: 'hut-58', onToggle: onToggleBuildType },
    { row: rows[1], thumbnail: 'farm-58', onToggle: onToggleBuildType },
  ]);
  assert.deepEqual(appendedCards.map((entry) => entry.rowId), ['hut', 'farm']);
});

