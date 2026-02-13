import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCanonicalScenarioTuning,
  buildScenarioTuningSignature,
  buildScenarioTuningSignatureMap,
} from '../src/content/scenarioTuningSignature.js';
import {
  buildScenarioTuningBaselineSuggestionMarkdown,
  buildScenarioTuningBaselineSuggestionPayload,
  buildScenarioTuningBaselineReport,
  formatScenarioTuningBaselineSnippet,
  formatScenarioTuningTotalAbsDeltaSnippet,
  getScenarioTuningBaselineChangeSummary,
} from '../src/content/scenarioTuningBaselineCheck.js';

test('buildCanonicalScenarioTuning strips neutral and invalid values', () => {
  const canonical = buildCanonicalScenarioTuning({
    productionMultipliers: {
      resource: { food: 1, wood: 1.05, stone: Number.NaN },
      job: { scholar: 1.08 },
    },
    jobPriorityMultipliers: {
      scholar: 1.12,
      medic: Infinity,
    },
  });

  assert.deepEqual(canonical, {
    job: { scholar: 1.08 },
    priority: { scholar: 1.12 },
    resource: { wood: 1.05 },
  });
});

test('buildScenarioTuningSignature is deterministic', () => {
  const scenario = {
    productionMultipliers: {
      resource: { food: 1.06 },
      job: { scholar: 1.08 },
    },
    jobPriorityMultipliers: { scholar: 1.12 },
  };

  const first = buildScenarioTuningSignature(scenario);
  const second = buildScenarioTuningSignature(scenario);
  assert.equal(first, second);
});

test('buildScenarioTuningSignatureMap sorts by scenario key', () => {
  const signatures = buildScenarioTuningSignatureMap({
    zeta: { productionMultipliers: { resource: { food: 1.01 }, job: {} }, jobPriorityMultipliers: {} },
    alpha: { productionMultipliers: { resource: { food: 1.02 }, job: {} }, jobPriorityMultipliers: {} },
  });

  assert.deepEqual(Object.keys(signatures), ['alpha', 'zeta']);
});

test('buildScenarioTuningBaselineReport flags changed signatures', () => {
  const report = buildScenarioTuningBaselineReport({
    scenarios: {
      frontier: {
        productionMultipliers: { resource: { food: 1.06 }, job: {} },
        jobPriorityMultipliers: {},
      },
    },
    expectedSignatures: {
      frontier: 'deadbeef',
    },
    expectedTotalAbsDelta: {
      frontier: 0,
    },
  });

  assert.equal(report.overallPassed, false);
  assert.equal(report.changedCount, 1);
  assert.equal(report.intensityChangedCount, 1);
  assert.equal(report.results[0].scenarioId, 'frontier');
  assert.equal(report.results[0].changed, true);
  assert.ok(report.snippets.scenarioTuningBaseline.includes('EXPECTED_SCENARIO_TUNING_SIGNATURES'));
  assert.ok(
    report.snippets.scenarioTuningTotalAbsDeltaBaseline.includes('EXPECTED_SCENARIO_TUNING_TOTAL_ABS_DELTA'),
  );
});

test('buildScenarioTuningBaselineSuggestionPayload mirrors report payload', () => {
  const payload = buildScenarioTuningBaselineSuggestionPayload({
    scenarios: {
      frontier: {
        productionMultipliers: { resource: { food: 1.06 }, job: {} },
        jobPriorityMultipliers: {},
      },
    },
    expectedSignatures: {
      frontier: 'deadbeef',
    },
    expectedTotalAbsDelta: {
      frontier: 1,
    },
  });

  assert.equal(payload.changedCount, 1);
  assert.equal(payload.intensityChangedCount, 1);
  assert.equal(payload.strictIntensityRecommended, true);
  assert.ok(payload.strictIntensityCommand.includes('SIM_SCENARIO_TUNING_ENFORCE_INTENSITY=1'));
  assert.equal(payload.results[0].changed, true);
  assert.equal(payload.intensityResults[0].changed, true);
});

test('formatScenarioTuningBaselineSnippet emits copy-ready export', () => {
  const snippet = formatScenarioTuningBaselineSnippet({
    frontier: 'aaaa1111',
  });

  assert.ok(snippet.startsWith('export const EXPECTED_SCENARIO_TUNING_SIGNATURES ='));
  assert.ok(snippet.includes('"frontier"'));
});

test('formatScenarioTuningTotalAbsDeltaSnippet emits copy-ready export', () => {
  const snippet = formatScenarioTuningTotalAbsDeltaSnippet({
    frontier: 0,
    harsh: 122,
  });

  assert.ok(snippet.startsWith('export const EXPECTED_SCENARIO_TUNING_TOTAL_ABS_DELTA ='));
  assert.ok(snippet.includes('"harsh"'));
});

test('buildScenarioTuningBaselineSuggestionMarkdown renders changed scenarios', () => {
  const markdown = buildScenarioTuningBaselineSuggestionMarkdown({
    results: [
      {
        scenarioId: 'frontier',
        expectedSignature: 'aaaa1111',
        currentSignature: 'bbbb2222',
        changed: true,
      },
    ],
    intensityResults: [
      {
        scenarioId: 'frontier',
        expectedTotalAbsDeltaPercent: 0,
        currentTotalAbsDeltaPercent: 12,
        changed: true,
      },
    ],
    snippets: {
      scenarioTuningBaseline: 'export const EXPECTED_SCENARIO_TUNING_SIGNATURES = {};\n',
      scenarioTuningTotalAbsDeltaBaseline:
        'export const EXPECTED_SCENARIO_TUNING_TOTAL_ABS_DELTA = {};\n',
    },
    strictIntensityRecommended: true,
    strictIntensityCommand:
      'SIM_SCENARIO_TUNING_ENFORCE_INTENSITY=1 npm run simulate:check:tuning-baseline',
  });

  assert.ok(markdown.includes('# Scenario Tuning Baseline Suggestions'));
  assert.ok(markdown.includes('frontier: aaaa1111 -> bbbb2222'));
  assert.ok(markdown.includes('EXPECTED_SCENARIO_TUNING_SIGNATURES'));
  assert.ok(markdown.includes('EXPECTED_SCENARIO_TUNING_TOTAL_ABS_DELTA'));
  assert.ok(markdown.includes('## Enforcement Guidance'));
  assert.ok(markdown.includes('Strict intensity enforcement recommended: yes'));
  assert.ok(markdown.includes('SIM_SCENARIO_TUNING_ENFORCE_INTENSITY=1'));
});

test('getScenarioTuningBaselineChangeSummary counts changes', () => {
  const summary = getScenarioTuningBaselineChangeSummary({
    results: [{ changed: false }, { changed: true }],
    intensityResults: [{ changed: false }, { changed: true }],
  });
  assert.equal(summary.changedSignatures, 1);
  assert.equal(summary.changedTotalAbsDelta, 1);
  assert.equal(summary.hasChanges, true);
  assert.equal(summary.hasAnyChanges, true);
});
