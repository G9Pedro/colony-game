import test from 'node:test';
import assert from 'node:assert/strict';
import { withReportMeta, REPORT_KINDS } from '../src/game/reportPayloadMeta.js';
import { isValidBaselineSuggestionPayload } from '../src/game/reportPayloadValidatorsBaseline.js';

function buildBaselinePayload() {
  const suggestedAggregateBounds = {
    frontier: { alivePopulationMean: { min: 8, max: 8.2 } },
  };
  const suggestedSnapshotSignatures = { 'frontier:standard': 'bbbb2222' };
  return withReportMeta(REPORT_KINDS.baselineSuggestions, {
    driftRuns: 8,
    currentAggregateBounds: {
      frontier: { alivePopulationMean: { min: 7.9, max: 8.1 } },
    },
    suggestedAggregateBounds,
    currentSnapshotSignatures: { 'frontier:standard': 'aaaa1111' },
    suggestedSnapshotSignatures,
    aggregateDelta: {
      frontier: {
        alivePopulationMean: {
          changed: true,
          minDelta: 0.1,
          maxDelta: 0.1,
        },
      },
    },
    snapshotDelta: [
      {
        key: 'frontier:standard',
        changed: true,
        from: 'aaaa1111',
        to: 'bbbb2222',
      },
    ],
    snippets: {
      regressionBaseline: `export const AGGREGATE_BASELINE_BOUNDS = ${JSON.stringify(suggestedAggregateBounds)};\n`,
      regressionSnapshots: `export const EXPECTED_SUMMARY_SIGNATURES = ${JSON.stringify(suggestedSnapshotSignatures)};\n`,
    },
  });
}

test('baseline module validator accepts a contract-compliant payload', () => {
  assert.equal(isValidBaselineSuggestionPayload(buildBaselinePayload()), true);
});

test('baseline module validator rejects aggregate delta inconsistency', () => {
  const payload = buildBaselinePayload();
  payload.aggregateDelta.frontier.alivePopulationMean.maxDelta = 0.2;
  assert.equal(isValidBaselineSuggestionPayload(payload), false);
});
