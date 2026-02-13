import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildScenarioTuningDashboard,
  buildScenarioTuningDashboardMarkdown,
} from '../src/content/scenarioTuningDashboard.js';

test('buildScenarioTuningDashboard computes deltas and ranking', () => {
  const dashboard = buildScenarioTuningDashboard({
    frontier: {
      id: 'frontier',
      name: 'Frontier',
      description: 'Neutral baseline.',
      productionMultipliers: { resource: {}, job: {} },
      jobPriorityMultipliers: {},
    },
    prosperous: {
      id: 'prosperous',
      name: 'Prosperous',
      description: 'Boosted economy.',
      productionMultipliers: {
        resource: { food: 1.1 },
        job: { scholar: 1.08 },
      },
      jobPriorityMultipliers: { scholar: 1.12 },
    },
  });

  assert.equal(dashboard.scenarioCount, 2);
  assert.equal(dashboard.activeScenarioCount, 1);

  const prosperous = dashboard.scenarios.find((item) => item.id === 'prosperous');
  assert.equal(prosperous.isNeutral, false);
  assert.equal(prosperous.resourceOutputDeltas[0].key, 'food');
  assert.equal(prosperous.resourceOutputDeltas[0].deltaPercent, 10);
  assert.equal(prosperous.jobOutputDeltas[0].key, 'scholar');
  assert.equal(dashboard.ranking[0].scenarioId, 'prosperous');
});

test('buildScenarioTuningDashboard ignores neutral and invalid values', () => {
  const dashboard = buildScenarioTuningDashboard({
    test: {
      id: 'test',
      name: 'Test',
      description: 'Validation sample.',
      productionMultipliers: {
        resource: { food: 1, wood: Number.NaN },
        job: { farmer: 1 },
      },
      jobPriorityMultipliers: { medic: Infinity },
    },
  });

  assert.equal(dashboard.activeScenarioCount, 0);
  assert.equal(dashboard.scenarios[0].resourceOutputDeltas.length, 0);
  assert.equal(dashboard.scenarios[0].jobPriorityDeltas.length, 0);
  assert.equal(dashboard.scenarios[0].isNeutral, true);
});

test('buildScenarioTuningDashboardMarkdown renders ranking and details', () => {
  const markdown = buildScenarioTuningDashboardMarkdown({
    scenarioCount: 2,
    activeScenarioCount: 1,
    ranking: [
      { rank: 1, scenarioId: 'prosperous', totalAbsDeltaPercent: 30.2 },
      { rank: 2, scenarioId: 'frontier', totalAbsDeltaPercent: 0 },
    ],
    scenarios: [
      {
        id: 'frontier',
        name: 'Frontier',
        description: 'Neutral baseline.',
        resourceOutputDeltas: [],
        jobOutputDeltas: [],
        jobPriorityDeltas: [],
        isNeutral: true,
      },
      {
        id: 'prosperous',
        name: 'Prosperous',
        description: 'Boosted economy.',
        resourceOutputDeltas: [{ key: 'food', deltaPercent: 6, multiplier: 1.06 }],
        jobOutputDeltas: [],
        jobPriorityDeltas: [],
        isNeutral: false,
      },
    ],
  });

  assert.ok(markdown.includes('# Scenario Tuning Dashboard'));
  assert.ok(markdown.includes('1. prosperous'));
  assert.ok(markdown.includes('Neutral tuning'));
  assert.ok(markdown.includes('food +6% (x1.06)'));
});
