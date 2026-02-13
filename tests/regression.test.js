import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAggregateRegressionReport,
  buildRegressionReport,
  evaluateSimulationSummary,
} from '../src/game/regression.js';

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

test('buildAggregateRegressionReport computes aggregate scenario pass/fail', () => {
  const report = buildAggregateRegressionReport({
    summaries: [
      {
        scenarioId: 'frontier',
        status: 'playing',
        alivePopulation: 8,
        buildings: 9,
        day: 8,
        completedResearch: [],
      },
      {
        scenarioId: 'frontier',
        status: 'playing',
        alivePopulation: 8,
        buildings: 9,
        day: 8,
        completedResearch: [],
      },
      {
        scenarioId: 'harsh',
        status: 'lost',
        alivePopulation: 2,
        buildings: 3,
        day: 4,
        completedResearch: [],
      },
    ],
    baselineBounds: {
      frontier: {
        alivePopulationMean: { min: 7.5, max: 8.5 },
        buildingsMean: { min: 8.5, max: 9.5 },
        dayMean: { min: 7.5, max: 8.5 },
        survivalRate: { min: 1, max: 1 },
        masonryCompletionRate: { min: 0, max: 0 },
      },
      harsh: {
        alivePopulationMean: { min: 6, max: 7 },
        buildingsMean: { min: 7, max: 8 },
        dayMean: { min: 7, max: 8 },
        survivalRate: { min: 1, max: 1 },
        masonryCompletionRate: { min: 0, max: 0 },
      },
    },
  });

  assert.equal(report.scenarioResults.length, 2);
  const frontier = report.scenarioResults.find((result) => result.scenarioId === 'frontier');
  const harsh = report.scenarioResults.find((result) => result.scenarioId === 'harsh');
  assert.equal(frontier.passed, true);
  assert.equal(harsh.passed, false);
  assert.equal(report.overallPassed, false);
  assert.ok(harsh.failures.length > 0);
});
