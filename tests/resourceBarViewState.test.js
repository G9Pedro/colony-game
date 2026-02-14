import test from 'node:test';
import assert from 'node:assert/strict';
import { buildResourceBarRows } from '../src/ui/resourceBarViewState.js';

test('buildResourceBarRows maps definitions to rounded values and rate classes', () => {
  const calls = [];
  const rows = buildResourceBarRows({
    resourceDefinitions: {
      wood: { label: 'Wood' },
      stone: { label: 'Stone' },
    },
    resources: {
      wood: 13.8,
      stone: 7,
    },
    resourceRates: {
      wood: 2.4,
      stone: -1.1,
    },
    mapDisplayedValue: (resourceId, value) => {
      calls.push([resourceId, value]);
      return value + 0.5;
    },
  });

  assert.deepEqual(calls, [
    ['wood', 13.8],
    ['stone', 7],
  ]);
  assert.deepEqual(rows, [
    {
      id: 'wood',
      label: 'Wood',
      roundedValue: 14,
      rate: 2.4,
      rateClassName: 'positive',
    },
    {
      id: 'stone',
      label: 'Stone',
      roundedValue: 7,
      rate: -1.1,
      rateClassName: 'negative',
    },
  ]);
});

test('buildResourceBarRows defaults missing resources and rates to zero', () => {
  const rows = buildResourceBarRows({
    resourceDefinitions: {
      food: { label: 'Food' },
    },
    resources: {},
    resourceRates: {},
    mapDisplayedValue: (_resourceId, value) => value,
  });

  assert.deepEqual(rows, [
    {
      id: 'food',
      label: 'Food',
      roundedValue: 0,
      rate: 0,
      rateClassName: 'positive',
    },
  ]);
});

