import test from 'node:test';
import assert from 'node:assert/strict';
import { buildBuildCardRows, buildCategoryPillRows } from '../src/ui/buildMenuViewState.js';

test('buildCategoryPillRows marks active category', () => {
  const rows = buildCategoryPillRows(['housing', 'production', 'civic'], 'production');
  assert.deepEqual(rows, [
    { id: 'housing', label: 'housing', active: false },
    { id: 'production', label: 'production', active: true },
    { id: 'civic', label: 'civic', active: false },
  ]);
});

test('buildBuildCardRows filters by selected category and maps card states', () => {
  const state = { selectedCategory: 'production' };
  const calls = [];
  const rows = buildBuildCardRows({
    state,
    selectedBuildType: 'quarry',
    buildingDefinitions: {
      hut: { id: 'hut', name: 'Hut', category: 'housing' },
      quarry: { id: 'quarry', name: 'Quarry', category: 'production' },
      farm: { id: 'farm', name: 'Farm', category: 'production' },
    },
    isBuildingUnlocked: () => true,
    formatCost: () => 'cost',
    getBuildingCardState: (_state, definition) => {
      calls.push(definition.id);
      if (definition.id === 'quarry') {
        return { subtitle: 'Unlocked', warning: false, unlocked: true };
      }
      return { subtitle: 'Need wood', warning: true, unlocked: false };
    },
  });

  assert.deepEqual(calls, ['quarry', 'farm']);
  assert.deepEqual(rows, [
    {
      id: 'quarry',
      name: 'Quarry',
      subtitle: 'Unlocked',
      warning: false,
      unlocked: true,
      active: true,
    },
    {
      id: 'farm',
      name: 'Farm',
      subtitle: 'Need wood',
      warning: true,
      unlocked: false,
      active: false,
    },
  ]);
});

