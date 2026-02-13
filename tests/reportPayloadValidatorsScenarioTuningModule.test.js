import test from 'node:test';
import assert from 'node:assert/strict';
import { withReportMeta, REPORT_KINDS } from '../src/game/reportPayloadMeta.js';
import {
  isValidScenarioTuningDashboardPayload,
  isValidScenarioTuningSuggestionPayload,
  isValidScenarioTuningTrendPayload,
  isValidScenarioTuningValidationPayload,
} from '../src/game/reportPayloadValidatorsScenarioTuning.js';

function buildSuggestionPayload() {
  const signatures = { frontier: 'aaaa1111' };
  const totalAbsDelta = { frontier: 0 };
  return withReportMeta(REPORT_KINDS.scenarioTuningBaselineSuggestions, {
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
}

function buildValidationPayload() {
  return withReportMeta(REPORT_KINDS.scenarioTuningValidation, {
    ok: true,
    checkedScenarioCount: 3,
    issueCount: 0,
    errors: [],
    warnings: [],
  });
}

function buildDashboardPayload() {
  return withReportMeta(REPORT_KINDS.scenarioTuningDashboard, {
    scenarioCount: 1,
    activeScenarioCount: 0,
    scenarios: [
      {
        id: 'frontier',
        name: 'Frontier',
        description: 'Neutral baseline scenario.',
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
    signatureMap: { frontier: 'aaaa1111' },
    ranking: [
      {
        rank: 1,
        scenarioId: 'frontier',
        totalAbsDeltaPercent: 0,
      },
    ],
  });
}

function buildTrendPayload() {
  return withReportMeta(REPORT_KINDS.scenarioTuningTrend, {
    comparisonSource: 'signature-baseline',
    baselineReference: 'src/content/scenarioTuningBaseline.js',
    hasBaselineDashboard: false,
    baselineScenarioCount: 0,
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
}

test('scenario tuning module validators accept valid payload contracts', () => {
  assert.equal(isValidScenarioTuningSuggestionPayload(buildSuggestionPayload()), true);
  assert.equal(isValidScenarioTuningValidationPayload(buildValidationPayload()), true);
  assert.equal(isValidScenarioTuningDashboardPayload(buildDashboardPayload()), true);
  assert.equal(isValidScenarioTuningTrendPayload(buildTrendPayload()), true);
});

test('scenario tuning module trend validator rejects changed/id mismatch', () => {
  const payload = buildTrendPayload();
  payload.changedScenarioIds = ['frontier'];
  assert.equal(isValidScenarioTuningTrendPayload(payload), false);
});

test('scenario tuning module trend validator rejects unsorted scenario rows', () => {
  const payload = withReportMeta(REPORT_KINDS.scenarioTuningTrend, {
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
        scenarioId: 'zeta',
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
        scenarioId: 'alpha',
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
    changedScenarioIds: ['zeta'],
  });

  assert.equal(isValidScenarioTuningTrendPayload(payload), false);
});

test('scenario tuning module suggestion validator rejects unsorted rows', () => {
  const payload = buildSuggestionPayload();
  payload.currentSignatures = { alpha: 'aaaa1111', zeta: 'bbbb2222' };
  payload.expectedSignatures = { alpha: 'aaaa1111', zeta: 'bbbb2222' };
  payload.currentTotalAbsDelta = { alpha: 0, zeta: 0 };
  payload.expectedTotalAbsDelta = { alpha: 0, zeta: 0 };
  payload.results = [
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
  ];
  payload.intensityResults = [
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
  ];
  payload.snippets.scenarioTuningBaseline =
    'export const EXPECTED_SCENARIO_TUNING_SIGNATURES = {"alpha":"aaaa1111","zeta":"bbbb2222"};\n';
  payload.snippets.scenarioTuningTotalAbsDeltaBaseline =
    'export const EXPECTED_SCENARIO_TUNING_TOTAL_ABS_DELTA = {"alpha":0,"zeta":0};\n';

  assert.equal(isValidScenarioTuningSuggestionPayload(payload), false);
});
