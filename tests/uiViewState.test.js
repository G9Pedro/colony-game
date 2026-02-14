import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTopSummary, getRendererModeLabel, getStatusBannerMessage } from '../src/ui/uiViewState.js';

test('buildTopSummary formats population, morale, and storage labels', () => {
  const summary = buildTopSummary({
    colonists: [{ alive: true }, { alive: false }, { alive: true }],
    resources: {},
  }, {
    getPopulationCapacity: () => 12,
    getAverageMorale: () => 67.9,
    getUsedStorage: () => 45.8,
    getStorageCapacity: () => 90,
  });

  assert.deepEqual(summary, {
    populationText: '2 / 12',
    moraleText: '67',
    storageText: '45 / 90',
  });
});

test('ui view state helpers map renderer labels and banner messages', () => {
  assert.equal(getRendererModeLabel('isometric'), 'Isometric');
  assert.equal(getRendererModeLabel('three'), 'Three.js');
  assert.equal(getStatusBannerMessage('won'), 'Victory! Colony Charter Achieved.');
  assert.equal(getStatusBannerMessage('lost'), 'Defeat. Reset to start a new colony.');
  assert.equal(getStatusBannerMessage('running'), null);
});

