import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildSnapshotSignatureMap,
  buildSuggestedAggregateBounds,
  buildSuggestedBoundsFromMetrics,
} from '../src/game/baselineSuggestion.js';

test('buildSuggestedBoundsFromMetrics creates min/max envelope', () => {
  const metrics = {
    runCount: 8,
    alivePopulationMean: 7.5,
    buildingsMean: 8.25,
    survivalRate: 1,
  };
  const bounds = buildSuggestedBoundsFromMetrics(metrics, {
    alivePopulationMean: 0.2,
    buildingsMean: 0.1,
    survivalRate: 0,
  });

  assert.deepEqual(bounds.alivePopulationMean, { min: 7.3, max: 7.7 });
  assert.deepEqual(bounds.buildingsMean, { min: 8.15, max: 8.35 });
  assert.deepEqual(bounds.survivalRate, { min: 1, max: 1 });
});

test('buildSuggestedAggregateBounds maps scenario metrics', () => {
  const report = {
    scenarioResults: [
      {
        scenarioId: 'frontier',
        metrics: {
          runCount: 8,
          alivePopulationMean: 8,
          buildingsMean: 9,
          dayMean: 8,
          survivalRate: 1,
          masonryCompletionRate: 0,
        },
      },
    ],
  };
  const suggested = buildSuggestedAggregateBounds(report);
  assert.ok(suggested.frontier);
  assert.deepEqual(suggested.frontier.alivePopulationMean, { min: 7.9, max: 8.1 });
});

test('buildSnapshotSignatureMap extracts key-signature pairs', () => {
  const report = {
    results: [
      { key: 'frontier:standard', signature: 'aaaa1111' },
      { key: 'harsh:standard', signature: 'bbbb2222' },
    ],
  };
  const signatures = buildSnapshotSignatureMap(report);
  assert.deepEqual(signatures, {
    'frontier:standard': 'aaaa1111',
    'harsh:standard': 'bbbb2222',
  });
});
