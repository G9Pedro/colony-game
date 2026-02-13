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
  const suggestedAggregateBounds = {
    frontier: {
      alivePopulationMean: { min: 8, max: 8.2 },
    },
  };
  const suggestedSnapshotSignatures = {
    'frontier:standard': 'bbbb2222',
  };
  return withReportMeta(kind, {
    driftRuns: 8,
    currentAggregateBounds: {
      frontier: {
        alivePopulationMean: { min: 7.9, max: 8.1 },
      },
    },
    suggestedAggregateBounds,
    currentSnapshotSignatures: {
      'frontier:standard': 'aaaa1111',
    },
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
      regressionBaseline: `export const AGGREGATE_BASELINE_BOUNDS = ${JSON.stringify(suggestedAggregateBounds, null, 2)};\n`,
      regressionSnapshots: `export const EXPECTED_SUMMARY_SIGNATURES = ${JSON.stringify(suggestedSnapshotSignatures, null, 2)};\n`,
    },
  });
}

function buildValidScenarioTuningTrendPayload(
  kind = REPORT_KINDS.scenarioTuningTrend,
  overrides = {},
) {
  const basePayload = {
    comparisonSource: 'signature-baseline',
    baselineReference: 'src/content/scenarioTuningBaseline.js',
    hasBaselineDashboard: false,
    baselineScenarioCount: 0,
    scenarioCount: 2,
    changedCount: 1,
    unchangedCount: 1,
    hasChanges: true,
    statusCounts: {
      added: 1,
      changed: 0,
      removed: 0,
      unchanged: 1,
    },
    scenarios: [
      {
        scenarioId: 'frontier',
        status: 'unchanged',
        changed: false,
        signatureChanged: false,
        currentSignature: 'aaaa1111',
        baselineSignature: 'aaaa1111',
        currentTotalAbsDeltaPercent: 0,
        baselineTotalAbsDeltaPercent: 0,
        deltaTotalAbsDeltaPercent: 0,
      },
      {
        scenarioId: 'new',
        status: 'added',
        changed: true,
        signatureChanged: true,
        currentSignature: 'bbbb2222',
        baselineSignature: null,
        currentTotalAbsDeltaPercent: 10,
        baselineTotalAbsDeltaPercent: null,
        deltaTotalAbsDeltaPercent: null,
      },
    ],
    changedScenarioIds: ['new'],
  };

  return withReportMeta(kind, {
    ...basePayload,
    ...overrides,
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

test('isValidBaselineSuggestionPayload rejects unsorted snapshot delta entries', () => {
  const payload = buildValidBaselineSuggestionPayload();
  payload.currentSnapshotSignatures = {
    'zeta:standard': 'aaaa1111',
    'alpha:standard': 'aaaa1111',
  };
  payload.suggestedSnapshotSignatures = {
    'zeta:standard': 'bbbb2222',
    'alpha:standard': 'bbbb2222',
  };
  payload.snapshotDelta = [
    {
      key: 'zeta:standard',
      changed: true,
      from: 'aaaa1111',
      to: 'bbbb2222',
    },
    {
      key: 'alpha:standard',
      changed: true,
      from: 'aaaa1111',
      to: 'bbbb2222',
    },
  ];
  payload.snippets.regressionSnapshots =
    'export const EXPECTED_SUMMARY_SIGNATURES = {"zeta:standard":"bbbb2222","alpha:standard":"bbbb2222"};\n';
  assert.equal(isValidBaselineSuggestionPayload(payload), false);
});

test('isValidBaselineSuggestionPayload rejects aggregate delta mismatch against bounds maps', () => {
  const payload = buildValidBaselineSuggestionPayload();
  payload.aggregateDelta.frontier.alivePopulationMean.minDelta = 0.2;
  assert.equal(isValidBaselineSuggestionPayload(payload), false);
});

test('isValidBaselineSuggestionPayload rejects snippet mismatch against suggested values', () => {
  const payload = buildValidBaselineSuggestionPayload();
  payload.snippets.regressionSnapshots =
    'export const EXPECTED_SUMMARY_SIGNATURES = {"frontier:standard":"cccc3333"};\n';
  assert.equal(isValidBaselineSuggestionPayload(payload), false);
});

test('isValidScenarioTuningSuggestionPayload accepts fully shaped payload', () => {
  const signatures = { frontier: 'aaaa1111' };
  const totalAbsDelta = { frontier: 0 };
  const payload = withReportMeta(REPORT_KINDS.scenarioTuningBaselineSuggestions, {
    overallPassed: true,
    changedCount: 0,
    intensityChangedCount: 0,
    currentSignatures: signatures,
    expectedSignatures: signatures,
    currentTotalAbsDelta: totalAbsDelta,
    expectedTotalAbsDelta: totalAbsDelta,
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
      scenarioTuningBaseline: `export const EXPECTED_SCENARIO_TUNING_SIGNATURES = ${JSON.stringify(signatures)};\n`,
      scenarioTuningTotalAbsDeltaBaseline:
        `export const EXPECTED_SCENARIO_TUNING_TOTAL_ABS_DELTA = ${JSON.stringify(totalAbsDelta)};\n`,
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
  const currentSignatures = { frontier: 'aaaa1111' };
  const expectedSignatures = { frontier: 'bbbb2222' };
  const totalAbsDelta = { frontier: 0 };
  const payload = withReportMeta(REPORT_KINDS.scenarioTuningBaselineSuggestions, {
    overallPassed: true,
    changedCount: 0,
    intensityChangedCount: 0,
    currentSignatures,
    expectedSignatures,
    currentTotalAbsDelta: totalAbsDelta,
    expectedTotalAbsDelta: totalAbsDelta,
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
      scenarioTuningBaseline: `export const EXPECTED_SCENARIO_TUNING_SIGNATURES = ${JSON.stringify(currentSignatures)};\n`,
      scenarioTuningTotalAbsDeltaBaseline:
        `export const EXPECTED_SCENARIO_TUNING_TOTAL_ABS_DELTA = ${JSON.stringify(totalAbsDelta)};\n`,
    },
  });
  assert.equal(isValidScenarioTuningSuggestionPayload(payload), false);
});

test('isValidScenarioTuningSuggestionPayload rejects results mismatched to map values', () => {
  const currentSignatures = { frontier: 'aaaa1111' };
  const expectedSignatures = { frontier: 'aaaa1111' };
  const totalAbsDelta = { frontier: 0 };
  const payload = withReportMeta(REPORT_KINDS.scenarioTuningBaselineSuggestions, {
    overallPassed: true,
    changedCount: 0,
    intensityChangedCount: 0,
    currentSignatures,
    expectedSignatures,
    currentTotalAbsDelta: totalAbsDelta,
    expectedTotalAbsDelta: totalAbsDelta,
    results: [
      {
        scenarioId: 'frontier',
        currentSignature: 'cccc3333',
        expectedSignature: 'aaaa1111',
        changed: true,
        message: 'expected aaaa1111 but got cccc3333',
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
      scenarioTuningBaseline: `export const EXPECTED_SCENARIO_TUNING_SIGNATURES = ${JSON.stringify(currentSignatures)};\n`,
      scenarioTuningTotalAbsDeltaBaseline:
        `export const EXPECTED_SCENARIO_TUNING_TOTAL_ABS_DELTA = ${JSON.stringify(totalAbsDelta)};\n`,
    },
  });
  assert.equal(isValidScenarioTuningSuggestionPayload(payload), false);
});

test('isValidScenarioTuningSuggestionPayload rejects unsorted signature result rows', () => {
  const currentSignatures = { alpha: 'aaaa1111', zeta: 'bbbb2222' };
  const expectedSignatures = { alpha: 'aaaa1111', zeta: 'bbbb2222' };
  const totalAbsDelta = { alpha: 0, zeta: 0 };
  const payload = withReportMeta(REPORT_KINDS.scenarioTuningBaselineSuggestions, {
    overallPassed: true,
    changedCount: 0,
    intensityChangedCount: 0,
    currentSignatures,
    expectedSignatures,
    currentTotalAbsDelta: totalAbsDelta,
    expectedTotalAbsDelta: totalAbsDelta,
    results: [
      {
        scenarioId: 'zeta',
        currentSignature: 'bbbb2222',
        expectedSignature: 'bbbb2222',
        changed: false,
        message: null,
      },
      {
        scenarioId: 'alpha',
        currentSignature: 'aaaa1111',
        expectedSignature: 'aaaa1111',
        changed: false,
        message: null,
      },
    ],
    intensityResults: [
      {
        scenarioId: 'alpha',
        currentTotalAbsDeltaPercent: 0,
        expectedTotalAbsDeltaPercent: 0,
        changed: false,
        message: null,
      },
      {
        scenarioId: 'zeta',
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
      scenarioTuningBaseline:
        'export const EXPECTED_SCENARIO_TUNING_SIGNATURES = {"alpha":"aaaa1111","zeta":"bbbb2222"};\n',
      scenarioTuningTotalAbsDeltaBaseline:
        'export const EXPECTED_SCENARIO_TUNING_TOTAL_ABS_DELTA = {"alpha":0,"zeta":0};\n',
    },
  });
  assert.equal(isValidScenarioTuningSuggestionPayload(payload), false);
});

test('isValidScenarioTuningSuggestionPayload rejects unsorted intensity result rows', () => {
  const currentSignatures = { alpha: 'aaaa1111', zeta: 'bbbb2222' };
  const expectedSignatures = { alpha: 'aaaa1111', zeta: 'bbbb2222' };
  const totalAbsDelta = { alpha: 0, zeta: 0 };
  const payload = withReportMeta(REPORT_KINDS.scenarioTuningBaselineSuggestions, {
    overallPassed: true,
    changedCount: 0,
    intensityChangedCount: 0,
    currentSignatures,
    expectedSignatures,
    currentTotalAbsDelta: totalAbsDelta,
    expectedTotalAbsDelta: totalAbsDelta,
    results: [
      {
        scenarioId: 'alpha',
        currentSignature: 'aaaa1111',
        expectedSignature: 'aaaa1111',
        changed: false,
        message: null,
      },
      {
        scenarioId: 'zeta',
        currentSignature: 'bbbb2222',
        expectedSignature: 'bbbb2222',
        changed: false,
        message: null,
      },
    ],
    intensityResults: [
      {
        scenarioId: 'zeta',
        currentTotalAbsDeltaPercent: 0,
        expectedTotalAbsDeltaPercent: 0,
        changed: false,
        message: null,
      },
      {
        scenarioId: 'alpha',
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
      scenarioTuningBaseline:
        'export const EXPECTED_SCENARIO_TUNING_SIGNATURES = {"alpha":"aaaa1111","zeta":"bbbb2222"};\n',
      scenarioTuningTotalAbsDeltaBaseline:
        'export const EXPECTED_SCENARIO_TUNING_TOTAL_ABS_DELTA = {"alpha":0,"zeta":0};\n',
    },
  });
  assert.equal(isValidScenarioTuningSuggestionPayload(payload), false);
});

test('isValidScenarioTuningSuggestionPayload rejects snippet mismatch against current maps', () => {
  const payload = withReportMeta(REPORT_KINDS.scenarioTuningBaselineSuggestions, {
    overallPassed: true,
    changedCount: 0,
    intensityChangedCount: 0,
    currentSignatures: { frontier: 'aaaa1111' },
    expectedSignatures: { frontier: 'aaaa1111' },
    currentTotalAbsDelta: { frontier: 0 },
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
      scenarioTuningBaseline:
        'export const EXPECTED_SCENARIO_TUNING_SIGNATURES = {"frontier":"bbbb2222"};\n',
      scenarioTuningTotalAbsDeltaBaseline:
        'export const EXPECTED_SCENARIO_TUNING_TOTAL_ABS_DELTA = {"frontier":0};\n',
    },
  });
  assert.equal(isValidScenarioTuningSuggestionPayload(payload), false);
});

test('isValidScenarioTuningValidationPayload accepts validation report payload', () => {
  const payload = withReportMeta(REPORT_KINDS.scenarioTuningValidation, {
    ok: false,
    errors: [
      {
        severity: 'error',
        scenarioId: 'frontier',
        path: 'productionMultipliers.job.farmer',
        message: 'Multiplier is outside hard limits.',
      },
    ],
    warnings: [
      {
        severity: 'warn',
        scenarioId: 'frontier',
        path: 'jobPriorityMultipliers.scholar',
        message: 'Multiplier is outside recommended range.',
      },
    ],
    issueCount: 2,
    checkedScenarioCount: 3,
  });
  assert.equal(isValidScenarioTuningValidationPayload(payload), true);
});

test('isValidScenarioTuningValidationPayload rejects malformed issue entries', () => {
  const payload = withReportMeta(REPORT_KINDS.scenarioTuningValidation, {
    ok: false,
    errors: [
      {
        severity: 'warn',
        scenarioId: 'frontier',
        path: 'productionMultipliers.job.farmer',
        message: 'wrong severity',
      },
    ],
    warnings: [],
    issueCount: 1,
    checkedScenarioCount: 1,
  });
  assert.equal(isValidScenarioTuningValidationPayload(payload), false);
});

test('isValidScenarioTuningValidationPayload rejects unsorted issue arrays', () => {
  const payload = withReportMeta(REPORT_KINDS.scenarioTuningValidation, {
    ok: false,
    errors: [
      {
        severity: 'error',
        scenarioId: 'zeta',
        path: 'productionMultipliers.job.builder',
        message: 'z issue',
      },
      {
        severity: 'error',
        scenarioId: 'alpha',
        path: 'productionMultipliers.job.builder',
        message: 'a issue',
      },
    ],
    warnings: [
      {
        severity: 'warn',
        scenarioId: 'zeta',
        path: 'jobPriorityMultipliers.scholar',
        message: 'z warning',
      },
      {
        severity: 'warn',
        scenarioId: 'alpha',
        path: 'jobPriorityMultipliers.scholar',
        message: 'a warning',
      },
    ],
    issueCount: 4,
    checkedScenarioCount: 2,
  });
  assert.equal(isValidScenarioTuningValidationPayload(payload), false);
});

test('isValidScenarioTuningValidationPayload rejects inconsistent counts and ok flag', () => {
  const payload = withReportMeta(REPORT_KINDS.scenarioTuningValidation, {
    ok: true,
    errors: [
      {
        severity: 'error',
        scenarioId: 'frontier',
        path: 'productionMultipliers.job.farmer',
        message: 'hard limit',
      },
    ],
    warnings: [],
    issueCount: 0,
    checkedScenarioCount: 1,
  });
  assert.equal(isValidScenarioTuningValidationPayload(payload), false);
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

test('isValidScenarioTuningDashboardPayload rejects unsorted delta entries', () => {
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
            key: 'wood',
            multiplier: 1.05,
            deltaPercent: 5,
            absDeltaPercent: 5,
          },
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
          count: 2,
          meanAbsDeltaPercent: 7.5,
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
        totalAbsDeltaPercent: 15,
        isNeutral: false,
      },
    ],
    ranking: [
      {
        rank: 1,
        scenarioId: 'frontier',
        totalAbsDeltaPercent: 15,
      },
    ],
    signatureMap: { frontier: 'aaaa1111' },
  });
  assert.equal(isValidScenarioTuningDashboardPayload(payload), false);
});

test('isValidScenarioTuningDashboardPayload rejects unsorted scenario rows', () => {
  const payload = withReportMeta(REPORT_KINDS.scenarioTuningDashboard, {
    scenarioCount: 2,
    activeScenarioCount: 0,
    scenarios: [
      {
        id: 'zeta',
        name: 'Zeta',
        description: 'Baseline',
        signature: 'bbbb2222',
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
      {
        id: 'alpha',
        name: 'Alpha',
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
        scenarioId: 'alpha',
        totalAbsDeltaPercent: 0,
      },
      {
        rank: 2,
        scenarioId: 'zeta',
        totalAbsDeltaPercent: 0,
      },
    ],
    signatureMap: { alpha: 'aaaa1111', zeta: 'bbbb2222' },
  });
  assert.equal(isValidScenarioTuningDashboardPayload(payload), false);
});

test('isValidScenarioTuningTrendPayload accepts trend report payload', () => {
  const payload = buildValidScenarioTuningTrendPayload();
  assert.equal(isValidScenarioTuningTrendPayload(payload), true);
});

test('isValidScenarioTuningTrendPayload rejects unknown comparison source', () => {
  const payload = buildValidScenarioTuningTrendPayload(REPORT_KINDS.scenarioTuningTrend, {
    comparisonSource: 'unknown',
  });
  assert.equal(isValidScenarioTuningTrendPayload(payload), false);
});

test('isValidScenarioTuningTrendPayload rejects missing baseline dashboard metadata', () => {
  const payload = buildValidScenarioTuningTrendPayload(REPORT_KINDS.scenarioTuningTrend, {
    comparisonSource: 'dashboard',
    baselineReference: 'reports/scenario-tuning-dashboard.baseline.json',
    hasBaselineDashboard: true,
    baselineScenarioCount: 1,
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
    scenarios: [
      {
        scenarioId: 'frontier',
        status: 'unchanged',
        changed: false,
        signatureChanged: false,
        currentSignature: 'aaaa1111',
        baselineSignature: 'aaaa1111',
        currentTotalAbsDeltaPercent: 0,
        baselineTotalAbsDeltaPercent: 0,
        deltaTotalAbsDeltaPercent: 0,
      },
    ],
    changedScenarioIds: [],
  });
  delete payload.hasBaselineDashboard;
  assert.equal(isValidScenarioTuningTrendPayload(payload), false);
});

test('isValidScenarioTuningTrendPayload rejects invalid status counts', () => {
  const payload = buildValidScenarioTuningTrendPayload(REPORT_KINDS.scenarioTuningTrend, {
    statusCounts: {
      changed: 1,
      unchanged: 1,
    },
  });
  assert.equal(isValidScenarioTuningTrendPayload(payload), false);
});

test('isValidScenarioTuningTrendPayload rejects arithmetic count inconsistencies', () => {
  const payload = buildValidScenarioTuningTrendPayload(REPORT_KINDS.scenarioTuningTrend, {
    statusCounts: {
      added: 0,
      changed: 0,
      removed: 0,
      unchanged: 2,
    },
  });
  assert.equal(isValidScenarioTuningTrendPayload(payload), false);
});

test('isValidScenarioTuningTrendPayload rejects changedScenarioIds mismatch with scenario rows', () => {
  const payload = buildValidScenarioTuningTrendPayload(REPORT_KINDS.scenarioTuningTrend, {
    changedScenarioIds: ['frontier'],
  });
  assert.equal(isValidScenarioTuningTrendPayload(payload), false);
});

test('isValidScenarioTuningTrendPayload rejects unsorted scenario rows', () => {
  const payload = buildValidScenarioTuningTrendPayload(REPORT_KINDS.scenarioTuningTrend, {
    scenarios: [
      {
        scenarioId: 'new',
        status: 'added',
        changed: true,
        signatureChanged: true,
        currentSignature: 'bbbb2222',
        baselineSignature: null,
        currentTotalAbsDeltaPercent: 10,
        baselineTotalAbsDeltaPercent: null,
        deltaTotalAbsDeltaPercent: null,
      },
      {
        scenarioId: 'frontier',
        status: 'unchanged',
        changed: false,
        signatureChanged: false,
        currentSignature: 'aaaa1111',
        baselineSignature: 'aaaa1111',
        currentTotalAbsDeltaPercent: 0,
        baselineTotalAbsDeltaPercent: 0,
        deltaTotalAbsDeltaPercent: 0,
      },
    ],
    changedScenarioIds: ['new'],
  });
  assert.equal(isValidScenarioTuningTrendPayload(payload), false);
});

test('isValidReportArtifactsValidationPayload accepts validation summary payload', () => {
  const payload = withReportMeta(REPORT_KINDS.reportArtifactsValidation, {
    overallPassed: true,
    failureCount: 0,
    totalChecked: 2,
    statusCounts: { ok: 2, error: 0, invalid: 0, 'invalid-json': 0 },
    recommendedActions: [],
    results: [
      {
        path: 'reports/baseline-suggestions.json',
        kind: REPORT_KINDS.baselineSuggestions,
        status: 'ok',
        ok: true,
        message: null,
        recommendedCommand: null,
      },
      {
        path: 'reports/scenario-tuning-dashboard.json',
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
    statusCounts: { ok: '4', error: 0, invalid: 0, 'invalid-json': 0 },
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
    statusCounts: { ok: 1, error: 1, invalid: 0, 'invalid-json': 0 },
    recommendedActions: [
      { command: 'npm run simulate:report:tuning', paths: ['reports/scenario-tuning-dashboard.json'] },
    ],
    results: [
      {
        path: 'reports/baseline-suggestions.json',
        kind: REPORT_KINDS.baselineSuggestions,
        status: 'ok',
        ok: true,
        message: null,
        recommendedCommand: null,
      },
      {
        path: 'reports/scenario-tuning-dashboard.json',
        kind: REPORT_KINDS.scenarioTuningDashboard,
        status: 'error',
        ok: false,
        message: 'read failure',
        recommendedCommand: 'npm run simulate:report:tuning',
      },
    ],
  });
  assert.equal(isValidReportArtifactsValidationPayload(payload), false);
});

test('isValidReportArtifactsValidationPayload rejects result status/ok semantic mismatch', () => {
  const payload = withReportMeta(REPORT_KINDS.reportArtifactsValidation, {
    overallPassed: true,
    failureCount: 0,
    totalChecked: 1,
    statusCounts: { ok: 0, error: 1, invalid: 0, 'invalid-json': 0 },
    recommendedActions: [],
    results: [
      {
        path: 'reports/baseline-suggestions.json',
        kind: REPORT_KINDS.baselineSuggestions,
        status: 'error',
        ok: true,
        message: null,
        recommendedCommand: null,
      },
    ],
  });
  assert.equal(isValidReportArtifactsValidationPayload(payload), false);
});

test('isValidReportArtifactsValidationPayload rejects recommended actions mismatched to failures', () => {
  const payload = withReportMeta(REPORT_KINDS.reportArtifactsValidation, {
    overallPassed: false,
    failureCount: 1,
    totalChecked: 1,
    statusCounts: { ok: 0, error: 1, invalid: 0, 'invalid-json': 0 },
    recommendedActions: [],
    results: [
      {
        path: 'reports/scenario-tuning-dashboard.json',
        kind: REPORT_KINDS.scenarioTuningDashboard,
        status: 'error',
        ok: false,
        message: 'read failure',
        recommendedCommand: 'npm run simulate:report:tuning',
      },
    ],
  });
  assert.equal(isValidReportArtifactsValidationPayload(payload), false);
});

test('isValidReportArtifactsValidationPayload rejects unknown result kinds', () => {
  const payload = withReportMeta(REPORT_KINDS.reportArtifactsValidation, {
    overallPassed: true,
    failureCount: 0,
    totalChecked: 1,
    statusCounts: { ok: 1, error: 0, invalid: 0, 'invalid-json': 0 },
    recommendedActions: [],
    results: [
      {
        path: 'reports/baseline-suggestions.json',
        kind: 'unknown-kind',
        status: 'ok',
        ok: true,
        message: null,
        recommendedCommand: null,
      },
    ],
  });
  assert.equal(isValidReportArtifactsValidationPayload(payload), false);
});

test('isValidReportArtifactsValidationPayload rejects duplicate result paths', () => {
  const payload = withReportMeta(REPORT_KINDS.reportArtifactsValidation, {
    overallPassed: true,
    failureCount: 0,
    totalChecked: 2,
    statusCounts: { ok: 2, error: 0, invalid: 0, 'invalid-json': 0 },
    recommendedActions: [],
    results: [
      {
        path: 'reports/baseline-suggestions.json',
        kind: REPORT_KINDS.baselineSuggestions,
        status: 'ok',
        ok: true,
        message: null,
        recommendedCommand: null,
      },
      {
        path: 'reports/baseline-suggestions.json',
        kind: REPORT_KINDS.baselineSuggestions,
        status: 'ok',
        ok: true,
        message: null,
        recommendedCommand: null,
      },
    ],
  });
  assert.equal(isValidReportArtifactsValidationPayload(payload), false);
});

test('isValidReportArtifactsValidationPayload rejects unsorted result paths', () => {
  const payload = withReportMeta(REPORT_KINDS.reportArtifactsValidation, {
    overallPassed: true,
    failureCount: 0,
    totalChecked: 2,
    statusCounts: { ok: 2, error: 0, invalid: 0, 'invalid-json': 0 },
    recommendedActions: [],
    results: [
      {
        path: 'reports/scenario-tuning-dashboard.json',
        kind: REPORT_KINDS.scenarioTuningDashboard,
        status: 'ok',
        ok: true,
        message: null,
        recommendedCommand: null,
      },
      {
        path: 'reports/baseline-suggestions.json',
        kind: REPORT_KINDS.baselineSuggestions,
        status: 'ok',
        ok: true,
        message: null,
        recommendedCommand: null,
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
