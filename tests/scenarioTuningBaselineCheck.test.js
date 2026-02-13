import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCanonicalScenarioTuning,
  buildScenarioTuningSignature,
  buildScenarioTuningSignatureMap,
} from '../src/content/scenarioTuningSignature.js';
import {
  buildScenarioTuningBaselineReport,
  formatScenarioTuningBaselineSnippet,
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
  });

  assert.equal(report.overallPassed, false);
  assert.equal(report.changedCount, 1);
  assert.equal(report.results[0].scenarioId, 'frontier');
  assert.equal(report.results[0].changed, true);
  assert.ok(report.snippets.scenarioTuningBaseline.includes('EXPECTED_SCENARIO_TUNING_SIGNATURES'));
});

test('formatScenarioTuningBaselineSnippet emits copy-ready export', () => {
  const snippet = formatScenarioTuningBaselineSnippet({
    frontier: 'aaaa1111',
  });

  assert.ok(snippet.startsWith('export const EXPECTED_SCENARIO_TUNING_SIGNATURES ='));
  assert.ok(snippet.includes('"frontier"'));
});
