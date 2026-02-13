import { REPORT_KINDS, withReportMeta } from '../src/game/reportPayloadValidators.js';

export function buildScenarioTuningIntensityOnlyDriftPayload() {
  return withReportMeta(REPORT_KINDS.scenarioTuningBaselineSuggestions, {
    overallPassed: false,
    changedCount: 0,
    intensityChangedCount: 1,
    strictIntensityRecommended: true,
    strictIntensityCommand:
      'SIM_SCENARIO_TUNING_ENFORCE_INTENSITY=1 npm run simulate:check:tuning-baseline',
    currentSignatures: { frontier: 'aaaa1111' },
    expectedSignatures: { frontier: 'aaaa1111' },
    currentTotalAbsDelta: { frontier: 12 },
    expectedTotalAbsDelta: { frontier: 0 },
    results: [
      {
        scenarioId: 'frontier',
        currentSignature: 'aaaa1111',
        expectedSignature: 'aaaa1111',
        changed: false,
        message: null,
      },
    ],
    intensityResults: [
      {
        scenarioId: 'frontier',
        currentTotalAbsDeltaPercent: 12,
        expectedTotalAbsDeltaPercent: 0,
        changed: true,
        message: 'expected 0 but got 12',
      },
    ],
    snippets: {
      scenarioTuningBaseline:
        'export const EXPECTED_SCENARIO_TUNING_SIGNATURES = {"frontier":"aaaa1111"};\n',
      scenarioTuningTotalAbsDeltaBaseline:
        'export const EXPECTED_SCENARIO_TUNING_TOTAL_ABS_DELTA = {"frontier":12};\n',
    },
  });
}

export function buildBaselineSuggestionPayload({ changed }) {
  const suggestedAggregateBounds = {
    frontier: {
      alivePopulationMean: { min: 8, max: 8.2 },
    },
  };
  const suggestedSnapshotSignatures = {
    'frontier:standard': 'bbbb2222',
  };
  const currentAggregateBounds = {
    frontier: {
      alivePopulationMean: changed ? { min: 7.9, max: 8.1 } : { min: 8, max: 8.2 },
    },
  };
  const currentSnapshotSignatures = {
    'frontier:standard': changed ? 'aaaa1111' : 'bbbb2222',
  };

  return withReportMeta(REPORT_KINDS.baselineSuggestions, {
    driftRuns: 8,
    currentAggregateBounds,
    suggestedAggregateBounds,
    currentSnapshotSignatures,
    suggestedSnapshotSignatures,
    aggregateDelta: {
      frontier: {
        alivePopulationMean: {
          changed,
          minDelta: changed ? 0.1 : 0,
          maxDelta: changed ? 0.1 : 0,
        },
      },
    },
    snapshotDelta: [
      {
        key: 'frontier:standard',
        changed,
        from: currentSnapshotSignatures['frontier:standard'],
        to: suggestedSnapshotSignatures['frontier:standard'],
      },
    ],
    snippets: {
      regressionBaseline: `export const AGGREGATE_BASELINE_BOUNDS = ${JSON.stringify(suggestedAggregateBounds)};\n`,
      regressionSnapshots: `export const EXPECTED_SUMMARY_SIGNATURES = ${JSON.stringify(suggestedSnapshotSignatures)};\n`,
    },
  });
}
