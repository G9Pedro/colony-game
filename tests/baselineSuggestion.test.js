import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildBaselineSuggestionMarkdown,
  buildBaselineSuggestionPayload,
  buildAggregateBoundsDelta,
  buildSnapshotSignatureDelta,
  buildSnapshotSignatureMap,
  buildSuggestedAggregateBounds,
  buildSuggestedBoundsFromMetrics,
  formatAggregateBoundsSnippet,
  formatSnapshotSignaturesSnippet,
  getBaselineChangeSummary,
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

test('buildAggregateBoundsDelta marks changed and unchanged metrics', () => {
  const delta = buildAggregateBoundsDelta(
    {
      frontier: {
        alivePopulationMean: { min: 7.9, max: 8.1 },
      },
    },
    {
      frontier: {
        alivePopulationMean: { min: 8, max: 8.2 },
      },
    },
  );

  assert.equal(delta.frontier.alivePopulationMean.changed, true);
  assert.equal(delta.frontier.alivePopulationMean.minDelta, 0.1);
  assert.equal(delta.frontier.alivePopulationMean.maxDelta, 0.1);
});

test('buildSnapshotSignatureDelta reports changed keys', () => {
  const changes = buildSnapshotSignatureDelta(
    { 'frontier:standard': 'aaaa1111' },
    { 'frontier:standard': 'bbbb2222' },
  );
  assert.equal(changes.length, 1);
  assert.equal(changes[0].changed, true);
  assert.equal(changes[0].from, 'aaaa1111');
  assert.equal(changes[0].to, 'bbbb2222');
});

test('snippet formatters emit copy-ready export statements', () => {
  const boundsSnippet = formatAggregateBoundsSnippet({
    frontier: { alivePopulationMean: { min: 7.9, max: 8.1 } },
  });
  const signatureSnippet = formatSnapshotSignaturesSnippet({
    'frontier:standard': 'aaaa1111',
  });

  assert.ok(boundsSnippet.startsWith('export const AGGREGATE_BASELINE_BOUNDS ='));
  assert.ok(boundsSnippet.includes('"frontier"'));
  assert.ok(signatureSnippet.startsWith('export const EXPECTED_SUMMARY_SIGNATURES ='));
  assert.ok(signatureSnippet.includes('"frontier:standard"'));
});

test('buildBaselineSuggestionPayload composes deltas and snippets', () => {
  const payload = buildBaselineSuggestionPayload({
    currentAggregateBounds: {
      frontier: { alivePopulationMean: { min: 7.9, max: 8.1 } },
    },
    currentSnapshotSignatures: {
      'frontier:standard': 'aaaa1111',
    },
    aggregateReport: {
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
    },
    snapshotReport: {
      results: [{ key: 'frontier:standard', signature: 'bbbb2222' }],
    },
    driftRuns: 8,
  });

  assert.equal(payload.driftRuns, 8);
  assert.ok(payload.suggestedAggregateBounds.frontier);
  assert.equal(payload.snapshotDelta[0].changed, true);
  assert.ok(payload.snippets.regressionBaseline.includes('AGGREGATE_BASELINE_BOUNDS'));
  assert.ok(payload.snippets.regressionSnapshots.includes('EXPECTED_SUMMARY_SIGNATURES'));
});

test('buildBaselineSuggestionMarkdown emits readable sections', () => {
  const markdown = buildBaselineSuggestionMarkdown({
    generatedAt: '2026-01-01T00:00:00.000Z',
    driftRuns: 8,
    snapshotDelta: [{ changed: true }],
    snippets: {
      regressionBaseline: 'export const AGGREGATE_BASELINE_BOUNDS = {};\n',
      regressionSnapshots: 'export const EXPECTED_SUMMARY_SIGNATURES = {};\n',
    },
  });

  assert.ok(markdown.includes('# Baseline Suggestions'));
  assert.ok(markdown.includes('Suggested Aggregate Bounds'));
  assert.ok(markdown.includes('EXPECTED_SUMMARY_SIGNATURES'));
});

test('getBaselineChangeSummary counts changed entries', () => {
  const summary = getBaselineChangeSummary({
    aggregateDelta: {
      frontier: {
        alivePopulationMean: { changed: false },
        buildingsMean: { changed: true },
      },
      harsh: {
        survivalRate: { changed: true },
      },
    },
    snapshotDelta: [{ changed: false }, { changed: true }],
  });

  assert.equal(summary.aggregateChangedMetrics, 2);
  assert.equal(summary.snapshotChangedKeys, 1);
  assert.equal(summary.hasChanges, true);
});
