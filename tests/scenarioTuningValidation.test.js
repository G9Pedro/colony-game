import test from 'node:test';
import assert from 'node:assert/strict';
import { validateScenarioTuningDefinitions } from '../src/content/scenarioTuningValidation.js';

test('validateScenarioTuningDefinitions accepts current scenario catalog', () => {
  const result = validateScenarioTuningDefinitions();
  assert.equal(result.ok, true);
  assert.equal(result.errors.length, 0);
  assert.equal(result.warnings.length, 0);
  assert.equal(result.issueCount, 0);
  assert.equal(result.checkedScenarioCount > 0, true);
});

test('validateScenarioTuningDefinitions reports unknown keys as errors', () => {
  const result = validateScenarioTuningDefinitions({
    frontier: {
      productionMultipliers: {
        resource: { algae: 1.1 },
        job: {},
      },
      jobPriorityMultipliers: {},
    },
  });

  assert.equal(result.ok, false);
  assert.ok(
    result.errors.some(
      (error) =>
        error.path === 'productionMultipliers.resource.algae' &&
        error.message.includes('Unknown key'),
    ),
  );
});

test('validateScenarioTuningDefinitions reports extreme values as warnings/errors', () => {
  const result = validateScenarioTuningDefinitions({
    frontier: {
      productionMultipliers: {
        resource: { food: 1.4 },
        job: { farmer: 0 },
      },
      jobPriorityMultipliers: { scholar: 1.6 },
    },
  });

  assert.equal(result.ok, false);
  assert.ok(
    result.warnings.some(
      (warning) =>
        warning.path === 'productionMultipliers.resource.food' &&
        warning.message.includes('recommended range'),
    ),
  );
  assert.ok(
    result.warnings.some(
      (warning) =>
        warning.path === 'jobPriorityMultipliers.scholar' &&
        warning.message.includes('recommended range'),
    ),
  );
  assert.ok(
    result.errors.some(
      (error) =>
        error.path === 'productionMultipliers.job.farmer' &&
        error.message.includes('hard limits'),
    ),
  );
  assert.equal(result.issueCount, result.errors.length + result.warnings.length);
  assert.equal(result.errors.every((issue) => issue.severity === 'error'), true);
  assert.equal(result.warnings.every((issue) => issue.severity === 'warn'), true);
});
