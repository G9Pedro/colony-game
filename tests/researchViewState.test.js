import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildActiveResearchViewModel,
  buildResearchOptionViewModels,
} from '../src/ui/researchViewState.js';

test('buildActiveResearchViewModel returns null when no active research', () => {
  const viewModel = buildActiveResearchViewModel(
    { current: null, progress: 2 },
    { masonry: { name: 'Masonry', time: 10 } },
    () => 0,
  );
  assert.equal(viewModel, null);
});

test('buildActiveResearchViewModel computes progress for active technology', () => {
  const viewModel = buildActiveResearchViewModel(
    { current: 'masonry', progress: 4 },
    { masonry: { name: 'Masonry', time: 8 } },
    (part, whole) => (part / whole) * 100,
  );
  assert.deepEqual(viewModel, {
    id: 'masonry',
    name: 'Masonry',
    progress: 50,
  });
});

test('buildResearchOptionViewModels filters active and completed research', () => {
  const state = {
    resources: { knowledge: 40 },
    research: { current: 'masonry', completed: ['farming'] },
  };
  const options = buildResearchOptionViewModels({
    state,
    researchDefinitions: {},
    getAvailableResearch: () => [
      { id: 'farming', name: 'Farming', description: 'desc', cost: 20 },
      { id: 'masonry', name: 'Masonry', description: 'desc', cost: 25 },
      { id: 'navigation', name: 'Navigation', description: 'desc', cost: 35 },
    ],
  });

  assert.equal(options.length, 1);
  assert.equal(options[0].id, 'navigation');
  assert.equal(options[0].disabled, true);
});

test('buildResearchOptionViewModels sets disabled based on knowledge when idle', () => {
  const state = {
    resources: { knowledge: 25 },
    research: { current: null, completed: [] },
  };
  const options = buildResearchOptionViewModels({
    state,
    researchDefinitions: {},
    getAvailableResearch: () => [
      { id: 'architecture', name: 'Architecture', description: 'desc', cost: 30 },
      { id: 'smithing', name: 'Smithing', description: 'desc', cost: 20 },
    ],
  });

  assert.deepEqual(
    options.map((option) => ({ id: option.id, disabled: option.disabled })),
    [
      { id: 'architecture', disabled: true },
      { id: 'smithing', disabled: false },
    ],
  );
});

