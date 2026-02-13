import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRegressionReport, evaluateSimulationSummary } from '../src/game/regression.js';

test('evaluateSimulationSummary returns empty failures for passing summary', () => {
  const summary = {
    scenarioId: 'frontier',
    status: 'playing',
    alivePopulation: 8,
    buildings: 9,
    completedResearch: [],
  };
  const expected = {
    requiredStatus: 'playing',
    minAlivePopulation: 7,
    minBuildings: 8,
    requiredResearch: [],
  };

  const failures = evaluateSimulationSummary(summary, expected);
  assert.deepEqual(failures, []);
});

test('buildRegressionReport flags failures and computes overall status', () => {
  const report = buildRegressionReport({
    summaries: [
      {
        scenarioId: 'frontier',
        status: 'playing',
        alivePopulation: 8,
        buildings: 9,
        completedResearch: [],
      },
      {
        scenarioId: 'harsh',
        status: 'lost',
        alivePopulation: 1,
        buildings: 2,
        completedResearch: [],
      },
    ],
    expectations: {
      frontier: {
        requiredStatus: 'playing',
        minAlivePopulation: 7,
        minBuildings: 8,
        requiredResearch: [],
      },
      harsh: {
        requiredStatus: 'playing',
        minAlivePopulation: 6,
        minBuildings: 7,
        requiredResearch: [],
      },
    },
  });

  assert.equal(report.overallPassed, false);
  assert.equal(report.results.length, 2);
  assert.equal(report.results[0].passed, true);
  assert.equal(report.results[1].passed, false);
  assert.ok(report.results[1].failures.length > 0);
});
