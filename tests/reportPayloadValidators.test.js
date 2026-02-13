import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isValidBaselineSuggestionPayload,
  isValidReportArtifactsValidationPayload,
  isKnownReportKind,
  isValidScenarioTuningDashboardPayload,
  isValidScenarioTuningTrendPayload,
  isValidScenarioTuningSuggestionPayload,
  isValidScenarioTuningValidationPayload,
  REPORT_KINDS,
  REPORT_SCHEMA_VERSIONS,
  validateReportPayloadByKind,
  withReportMeta,
} from '../src/game/reportPayloadValidators.js';

test('withReportMeta stamps kind, schema version, and timestamps', () => {
  const payload = withReportMeta(REPORT_KINDS.baselineSuggestions, { value: 1 });
  assert.equal(payload.meta.kind, REPORT_KINDS.baselineSuggestions);
  assert.equal(payload.meta.schemaVersion, REPORT_SCHEMA_VERSIONS[REPORT_KINDS.baselineSuggestions]);
  assert.equal(typeof payload.meta.generatedAt, 'string');
  assert.equal(typeof payload.generatedAt, 'string');
  assert.equal(payload.meta.generatedAt, payload.generatedAt);
  assert.equal(payload.value, 1);
});

test('withReportMeta overwrites stale generatedAt/meta values from payload', () => {
  const payload = withReportMeta(REPORT_KINDS.baselineSuggestions, {
    generatedAt: '1999-01-01T00:00:00.000Z',
    meta: {
      kind: 'wrong-kind',
      schemaVersion: 999,
      generatedAt: '1999-01-01T00:00:00.000Z',
    },
  });

  assert.equal(payload.meta.kind, REPORT_KINDS.baselineSuggestions);
  assert.equal(payload.meta.schemaVersion, REPORT_SCHEMA_VERSIONS[REPORT_KINDS.baselineSuggestions]);
  assert.notEqual(payload.generatedAt, '1999-01-01T00:00:00.000Z');
  assert.equal(payload.generatedAt, payload.meta.generatedAt);
});

test('isValidBaselineSuggestionPayload accepts fully shaped payload', () => {
  const payload = withReportMeta(REPORT_KINDS.baselineSuggestions, {
    aggregateDelta: {},
    snapshotDelta: [],
    snippets: {
      regressionBaseline: 'export const AGGREGATE_BASELINE_BOUNDS = {};',
      regressionSnapshots: 'export const EXPECTED_SUMMARY_SIGNATURES = {};',
    },
  });

  assert.equal(isValidBaselineSuggestionPayload(payload), true);
});

test('isValidBaselineSuggestionPayload rejects missing metadata', () => {
  const payload = {
    aggregateDelta: {},
    snapshotDelta: [],
    snippets: {
      regressionBaseline: 'x',
      regressionSnapshots: 'y',
    },
  };
  assert.equal(isValidBaselineSuggestionPayload(payload), false);
});

test('isValidBaselineSuggestionPayload rejects generatedAt mismatch between root/meta', () => {
  const payload = withReportMeta(REPORT_KINDS.baselineSuggestions, {
    aggregateDelta: {},
    snapshotDelta: [],
    snippets: {
      regressionBaseline: 'x',
      regressionSnapshots: 'y',
    },
  });

  payload.generatedAt = '1999-01-01T00:00:00.000Z';
  assert.equal(isValidBaselineSuggestionPayload(payload), false);
});

test('isValidScenarioTuningSuggestionPayload accepts fully shaped payload', () => {
  const payload = withReportMeta(REPORT_KINDS.scenarioTuningBaselineSuggestions, {
    results: [],
    intensityResults: [],
    strictIntensityRecommended: false,
    strictIntensityCommand:
      'SIM_SCENARIO_TUNING_ENFORCE_INTENSITY=1 npm run simulate:check:tuning-baseline',
    snippets: {
      scenarioTuningBaseline: 'export const EXPECTED_SCENARIO_TUNING_SIGNATURES = {};',
      scenarioTuningTotalAbsDeltaBaseline:
        'export const EXPECTED_SCENARIO_TUNING_TOTAL_ABS_DELTA = {};',
    },
  });
  assert.equal(isValidScenarioTuningSuggestionPayload(payload), true);
});

test('isValidScenarioTuningSuggestionPayload rejects wrong report kind', () => {
  const payload = withReportMeta(REPORT_KINDS.baselineSuggestions, {
    results: [],
    intensityResults: [],
    strictIntensityRecommended: false,
    strictIntensityCommand:
      'SIM_SCENARIO_TUNING_ENFORCE_INTENSITY=1 npm run simulate:check:tuning-baseline',
    snippets: {
      scenarioTuningBaseline: 'export const EXPECTED_SCENARIO_TUNING_SIGNATURES = {};',
      scenarioTuningTotalAbsDeltaBaseline:
        'export const EXPECTED_SCENARIO_TUNING_TOTAL_ABS_DELTA = {};',
    },
  });
  assert.equal(isValidScenarioTuningSuggestionPayload(payload), false);
});

test('isValidScenarioTuningSuggestionPayload rejects missing strict enforcement fields', () => {
  const payload = withReportMeta(REPORT_KINDS.scenarioTuningBaselineSuggestions, {
    results: [],
    intensityResults: [],
    snippets: {
      scenarioTuningBaseline: 'export const EXPECTED_SCENARIO_TUNING_SIGNATURES = {};',
      scenarioTuningTotalAbsDeltaBaseline:
        'export const EXPECTED_SCENARIO_TUNING_TOTAL_ABS_DELTA = {};',
    },
  });
  assert.equal(isValidScenarioTuningSuggestionPayload(payload), false);
});

test('isValidScenarioTuningValidationPayload accepts validation report payload', () => {
  const payload = withReportMeta(REPORT_KINDS.scenarioTuningValidation, {
    ok: true,
    errors: [],
    warnings: [],
    issueCount: 0,
    checkedScenarioCount: 3,
  });
  assert.equal(isValidScenarioTuningValidationPayload(payload), true);
});

test('isValidScenarioTuningDashboardPayload accepts dashboard report payload', () => {
  const payload = withReportMeta(REPORT_KINDS.scenarioTuningDashboard, {
    scenarioCount: 3,
    activeScenarioCount: 2,
    scenarios: [],
    ranking: [],
    signatureMap: {},
  });
  assert.equal(isValidScenarioTuningDashboardPayload(payload), true);
});

test('isValidScenarioTuningTrendPayload accepts trend report payload', () => {
  const payload = withReportMeta(REPORT_KINDS.scenarioTuningTrend, {
    comparisonSource: 'signature-baseline',
    baselineReference: 'src/content/scenarioTuningBaseline.js',
    hasBaselineDashboard: false,
    baselineScenarioCount: 0,
    scenarioCount: 3,
    changedCount: 0,
    unchangedCount: 3,
    hasChanges: false,
    scenarios: [],
    changedScenarioIds: [],
  });
  assert.equal(isValidScenarioTuningTrendPayload(payload), true);
});

test('isValidScenarioTuningTrendPayload rejects unknown comparison source', () => {
  const payload = withReportMeta(REPORT_KINDS.scenarioTuningTrend, {
    comparisonSource: 'unknown',
    baselineReference: null,
    hasBaselineDashboard: false,
    baselineScenarioCount: 0,
    scenarioCount: 1,
    changedCount: 1,
    unchangedCount: 0,
    hasChanges: true,
    scenarios: [],
    changedScenarioIds: [],
  });
  assert.equal(isValidScenarioTuningTrendPayload(payload), false);
});

test('isValidScenarioTuningTrendPayload rejects missing baseline dashboard metadata', () => {
  const payload = withReportMeta(REPORT_KINDS.scenarioTuningTrend, {
    comparisonSource: 'dashboard',
    baselineReference: 'reports/scenario-tuning-dashboard.baseline.json',
    scenarioCount: 1,
    changedCount: 0,
    unchangedCount: 1,
    hasChanges: false,
    scenarios: [],
    changedScenarioIds: [],
  });
  assert.equal(isValidScenarioTuningTrendPayload(payload), false);
});

test('isValidReportArtifactsValidationPayload accepts validation summary payload', () => {
  const payload = withReportMeta(REPORT_KINDS.reportArtifactsValidation, {
    overallPassed: true,
    failureCount: 0,
    totalChecked: 4,
    statusCounts: { ok: 4 },
    recommendedActions: [],
    results: [],
  });
  assert.equal(isValidReportArtifactsValidationPayload(payload), true);
});

test('isValidReportArtifactsValidationPayload rejects malformed action and status counts', () => {
  const payload = withReportMeta(REPORT_KINDS.reportArtifactsValidation, {
    overallPassed: false,
    failureCount: 1,
    totalChecked: 4,
    statusCounts: { ok: '4' },
    recommendedActions: [{ command: 42, paths: [12] }],
    results: [],
  });
  assert.equal(isValidReportArtifactsValidationPayload(payload), false);
});

test('withReportMeta throws for unknown report kind', () => {
  assert.throws(
    () => withReportMeta('unknown-report-kind', {}),
    /Unknown report kind/i,
  );
});

test('isKnownReportKind returns true for registered kinds', () => {
  assert.equal(isKnownReportKind(REPORT_KINDS.baselineSuggestions), true);
  assert.equal(isKnownReportKind('unknown-kind'), false);
});

test('validateReportPayloadByKind validates payload and reports reason', () => {
  const validPayload = withReportMeta(REPORT_KINDS.baselineSuggestions, {
    aggregateDelta: {},
    snapshotDelta: [],
    snippets: {
      regressionBaseline: 'export const AGGREGATE_BASELINE_BOUNDS = {};',
      regressionSnapshots: 'export const EXPECTED_SUMMARY_SIGNATURES = {};',
    },
  });

  const validResult = validateReportPayloadByKind(REPORT_KINDS.baselineSuggestions, validPayload);
  assert.equal(validResult.ok, true);
  assert.equal(validResult.reason, null);

  const invalidResult = validateReportPayloadByKind(REPORT_KINDS.baselineSuggestions, {
    ...validPayload,
    snippets: {},
  });
  assert.equal(invalidResult.ok, false);
  assert.ok(invalidResult.reason?.includes('failed validation'));

  const unknownResult = validateReportPayloadByKind('unknown-kind', validPayload);
  assert.equal(unknownResult.ok, false);
  assert.ok(unknownResult.reason?.includes('Unknown report kind'));
});
