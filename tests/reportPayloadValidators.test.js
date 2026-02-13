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

function buildValidBaselineSuggestionPayload(kind = REPORT_KINDS.baselineSuggestions) {
  return withReportMeta(kind, {
    driftRuns: 8,
    currentAggregateBounds: {
      frontier: {
        alivePopulationMean: { min: 7.9, max: 8.1 },
      },
    },
    suggestedAggregateBounds: {
      frontier: {
        alivePopulationMean: { min: 8, max: 8.2 },
      },
    },
    currentSnapshotSignatures: {
      'frontier:standard': 'aaaa1111',
    },
    suggestedSnapshotSignatures: {
      'frontier:standard': 'bbbb2222',
    },
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
      regressionBaseline: 'export const AGGREGATE_BASELINE_BOUNDS = {};',
      regressionSnapshots: 'export const EXPECTED_SUMMARY_SIGNATURES = {};',
    },
  });
}

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
  const payload = buildValidBaselineSuggestionPayload();

  assert.equal(isValidBaselineSuggestionPayload(payload), true);
});

test('isValidBaselineSuggestionPayload rejects missing metadata', () => {
  const payload = buildValidBaselineSuggestionPayload();
  delete payload.meta;
  delete payload.generatedAt;
  assert.equal(isValidBaselineSuggestionPayload(payload), false);
});

test('isValidBaselineSuggestionPayload rejects generatedAt mismatch between root/meta', () => {
  const payload = buildValidBaselineSuggestionPayload();

  payload.generatedAt = '1999-01-01T00:00:00.000Z';
  assert.equal(isValidBaselineSuggestionPayload(payload), false);
});

test('isValidBaselineSuggestionPayload rejects snapshot delta mismatch against signature maps', () => {
  const payload = buildValidBaselineSuggestionPayload();
  payload.snapshotDelta[0].to = 'cccc3333';
  assert.equal(isValidBaselineSuggestionPayload(payload), false);
});

test('isValidScenarioTuningSuggestionPayload accepts fully shaped payload', () => {
  const payload = withReportMeta(REPORT_KINDS.scenarioTuningBaselineSuggestions, {
    overallPassed: true,
    changedCount: 0,
    intensityChangedCount: 0,
    currentSignatures: {},
    expectedSignatures: {},
    currentTotalAbsDelta: {},
    expectedTotalAbsDelta: {},
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
        currentTotalAbsDeltaPercent: 0,
        expectedTotalAbsDeltaPercent: 0,
        changed: false,
        message: null,
      },
    ],
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
    overallPassed: true,
    changedCount: 0,
    intensityChangedCount: 0,
    currentSignatures: {},
    expectedSignatures: {},
    currentTotalAbsDelta: {},
    expectedTotalAbsDelta: {},
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
    overallPassed: true,
    changedCount: 0,
    intensityChangedCount: 0,
    currentSignatures: {},
    expectedSignatures: {},
    currentTotalAbsDelta: {},
    expectedTotalAbsDelta: {},
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

test('isValidScenarioTuningSuggestionPayload rejects inconsistent changed counters', () => {
  const payload = withReportMeta(REPORT_KINDS.scenarioTuningBaselineSuggestions, {
    overallPassed: true,
    changedCount: 0,
    intensityChangedCount: 0,
    currentSignatures: {},
    expectedSignatures: {},
    currentTotalAbsDelta: {},
    expectedTotalAbsDelta: {},
    results: [
      {
        scenarioId: 'frontier',
        currentSignature: 'aaaa1111',
        expectedSignature: 'bbbb2222',
        changed: true,
        message: 'expected bbbb2222 but got aaaa1111',
      },
    ],
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
    scenarioCount: 1,
    activeScenarioCount: 1,
    scenarios: [
      {
        id: 'frontier',
        name: 'Frontier',
        description: 'Baseline',
        signature: 'aaaa1111',
        resourceOutputDeltas: [
          {
            key: 'food',
            multiplier: 1.1,
            deltaPercent: 10,
            absDeltaPercent: 10,
          },
        ],
        jobOutputDeltas: [],
        jobPriorityDeltas: [],
        resourceOutputSummary: {
          count: 1,
          meanAbsDeltaPercent: 10,
          maxAbsDeltaPercent: 10,
        },
        jobOutputSummary: {
          count: 0,
          meanAbsDeltaPercent: 0,
          maxAbsDeltaPercent: 0,
        },
        jobPrioritySummary: {
          count: 0,
          meanAbsDeltaPercent: 0,
          maxAbsDeltaPercent: 0,
        },
        totalAbsDeltaPercent: 10,
        isNeutral: false,
      },
    ],
    ranking: [
      {
        rank: 1,
        scenarioId: 'frontier',
        totalAbsDeltaPercent: 10,
      },
    ],
    signatureMap: { frontier: 'aaaa1111' },
  });
  assert.equal(isValidScenarioTuningDashboardPayload(payload), true);
});

test('isValidScenarioTuningDashboardPayload rejects ranking/signature inconsistencies', () => {
  const payload = withReportMeta(REPORT_KINDS.scenarioTuningDashboard, {
    scenarioCount: 1,
    activeScenarioCount: 1,
    scenarios: [
      {
        id: 'frontier',
        name: 'Frontier',
        description: 'Baseline',
        signature: 'aaaa1111',
        resourceOutputDeltas: [],
        jobOutputDeltas: [],
        jobPriorityDeltas: [],
        resourceOutputSummary: {
          count: 0,
          meanAbsDeltaPercent: 0,
          maxAbsDeltaPercent: 0,
        },
        jobOutputSummary: {
          count: 0,
          meanAbsDeltaPercent: 0,
          maxAbsDeltaPercent: 0,
        },
        jobPrioritySummary: {
          count: 0,
          meanAbsDeltaPercent: 0,
          maxAbsDeltaPercent: 0,
        },
        totalAbsDeltaPercent: 0,
        isNeutral: true,
      },
    ],
    ranking: [
      {
        rank: 1,
        scenarioId: 'frontier',
        totalAbsDeltaPercent: 25,
      },
    ],
    signatureMap: { frontier: 'bbbb2222' },
  });
  assert.equal(isValidScenarioTuningDashboardPayload(payload), false);
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
    statusCounts: {
      added: 0,
      changed: 0,
      removed: 0,
      unchanged: 3,
    },
    scenarios: [{ scenarioId: 'a' }, { scenarioId: 'b' }, { scenarioId: 'c' }],
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
    statusCounts: {
      added: 1,
      changed: 0,
      removed: 0,
      unchanged: 0,
    },
    scenarios: [{ scenarioId: 'new' }],
    changedScenarioIds: ['new'],
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
    statusCounts: {
      added: 0,
      changed: 0,
      removed: 0,
      unchanged: 1,
    },
    scenarios: [{ scenarioId: 'frontier' }],
    changedScenarioIds: [],
  });
  assert.equal(isValidScenarioTuningTrendPayload(payload), false);
});

test('isValidScenarioTuningTrendPayload rejects invalid status counts', () => {
  const payload = withReportMeta(REPORT_KINDS.scenarioTuningTrend, {
    comparisonSource: 'signature-baseline',
    baselineReference: null,
    hasBaselineDashboard: false,
    baselineScenarioCount: 0,
    scenarioCount: 2,
    changedCount: 1,
    unchangedCount: 1,
    hasChanges: true,
    statusCounts: {
      changed: 1,
      unchanged: 1,
    },
    scenarios: [{ scenarioId: 'changed' }, { scenarioId: 'unchanged' }],
    changedScenarioIds: ['changed'],
  });
  assert.equal(isValidScenarioTuningTrendPayload(payload), false);
});

test('isValidScenarioTuningTrendPayload rejects arithmetic count inconsistencies', () => {
  const payload = withReportMeta(REPORT_KINDS.scenarioTuningTrend, {
    comparisonSource: 'dashboard',
    baselineReference: 'reports/scenario-tuning-dashboard.baseline.json',
    hasBaselineDashboard: true,
    baselineScenarioCount: 2,
    scenarioCount: 2,
    changedCount: 1,
    unchangedCount: 1,
    hasChanges: true,
    statusCounts: {
      added: 0,
      changed: 0,
      removed: 0,
      unchanged: 2,
    },
    scenarios: [{ scenarioId: 'frontier' }, { scenarioId: 'prosperous' }],
    changedScenarioIds: ['prosperous'],
  });
  assert.equal(isValidScenarioTuningTrendPayload(payload), false);
});

test('isValidReportArtifactsValidationPayload accepts validation summary payload', () => {
  const payload = withReportMeta(REPORT_KINDS.reportArtifactsValidation, {
    overallPassed: true,
    failureCount: 0,
    totalChecked: 2,
    statusCounts: { ok: 2 },
    recommendedActions: [],
    results: [
      {
        path: 'reports/a.json',
        kind: REPORT_KINDS.baselineSuggestions,
        status: 'ok',
        ok: true,
        message: null,
        recommendedCommand: null,
      },
      {
        path: 'reports/b.json',
        kind: REPORT_KINDS.scenarioTuningDashboard,
        status: 'ok',
        ok: true,
        message: null,
        recommendedCommand: null,
      },
    ],
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
    results: [
      {
        path: 'reports/a.json',
        kind: REPORT_KINDS.baselineSuggestions,
        status: 'error',
        ok: false,
        message: 'failed',
        recommendedCommand: 'npm run verify',
      },
    ],
  });
  assert.equal(isValidReportArtifactsValidationPayload(payload), false);
});

test('isValidReportArtifactsValidationPayload rejects inconsistent aggregate counters', () => {
  const payload = withReportMeta(REPORT_KINDS.reportArtifactsValidation, {
    overallPassed: true,
    failureCount: 0,
    totalChecked: 2,
    statusCounts: { ok: 1, error: 1 },
    recommendedActions: [{ command: 'npm run verify', paths: ['reports/broken.json'] }],
    results: [
      {
        path: 'reports/a.json',
        kind: REPORT_KINDS.baselineSuggestions,
        status: 'ok',
        ok: true,
        message: null,
        recommendedCommand: null,
      },
      {
        path: 'reports/broken.json',
        kind: REPORT_KINDS.scenarioTuningDashboard,
        status: 'error',
        ok: false,
        message: 'read failure',
        recommendedCommand: 'npm run verify',
      },
    ],
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
  const validPayload = buildValidBaselineSuggestionPayload();

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
