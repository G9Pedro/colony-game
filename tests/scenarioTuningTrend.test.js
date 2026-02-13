import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildScenarioTuningTrendMarkdown,
  buildScenarioTuningTrendReport,
} from '../src/content/scenarioTuningTrend.js';

test('buildScenarioTuningTrendReport compares current dashboard with baseline dashboard', () => {
  const report = buildScenarioTuningTrendReport({
    comparisonSource: 'dashboard',
    baselineReference: 'reports/scenario-tuning-dashboard.baseline.json',
    currentDashboard: {
      scenarios: [
        { id: 'frontier', signature: 'aaaa1111', totalAbsDeltaPercent: 0 },
        { id: 'prosperous', signature: 'bbbb2222', totalAbsDeltaPercent: 30 },
        { id: 'new-scenario', signature: 'cccc3333', totalAbsDeltaPercent: 10 },
      ],
    },
    baselineDashboard: {
      scenarios: [
        { id: 'frontier', signature: 'aaaa1111', totalAbsDeltaPercent: 0 },
        { id: 'prosperous', signature: 'bbbb9999', totalAbsDeltaPercent: 24 },
        { id: 'removed-scenario', signature: 'dddd4444', totalAbsDeltaPercent: 3 },
      ],
    },
  });

  assert.equal(report.scenarioCount, 4);
  assert.equal(report.hasBaselineDashboard, true);
  assert.equal(report.baselineScenarioCount, 3);
  assert.equal(report.changedCount, 3);
  assert.equal(report.hasChanges, true);
  assert.deepEqual(report.changedScenarioIds, ['new-scenario', 'prosperous', 'removed-scenario']);

  const prosperous = report.scenarios.find((scenario) => scenario.scenarioId === 'prosperous');
  assert.equal(prosperous.status, 'changed');
  assert.equal(prosperous.signatureChanged, true);
  assert.equal(prosperous.deltaTotalAbsDeltaPercent, 6);
});

test('buildScenarioTuningTrendReport falls back to signature baselines', () => {
  const report = buildScenarioTuningTrendReport({
    comparisonSource: 'signature-baseline',
    baselineReference: 'src/content/scenarioTuningBaseline.js',
    currentDashboard: {
      scenarios: [{ id: 'frontier', signature: 'aaaa1111', totalAbsDeltaPercent: 0 }],
    },
    baselineSignatures: {
      frontier: 'aaaa1111',
      harsh: 'bbbb2222',
    },
    baselineTotalAbsDelta: {
      frontier: 0,
      harsh: 122,
    },
  });

  assert.equal(report.changedCount, 1);
  assert.equal(report.hasBaselineDashboard, false);
  assert.equal(report.baselineScenarioCount, 0);
  assert.deepEqual(report.changedScenarioIds, ['harsh']);
  const frontier = report.scenarios.find((scenario) => scenario.scenarioId === 'frontier');
  assert.equal(frontier.status, 'unchanged');
  assert.equal(frontier.baselineTotalAbsDeltaPercent, 0);
  assert.equal(frontier.deltaTotalAbsDeltaPercent, 0);
});

test('buildScenarioTuningTrendMarkdown renders changed table and no-change summary', () => {
  const changedMarkdown = buildScenarioTuningTrendMarkdown({
    comparisonSource: 'dashboard',
    baselineReference: 'baseline-file',
    hasBaselineDashboard: true,
    baselineScenarioCount: 2,
    scenarioCount: 2,
    changedCount: 1,
    unchangedCount: 1,
    hasChanges: true,
    scenarios: [
      {
        scenarioId: 'frontier',
        changed: false,
      },
      {
        scenarioId: 'prosperous',
        status: 'changed',
        changed: true,
        baselineSignature: 'aaaa1111',
        currentSignature: 'bbbb2222',
        deltaTotalAbsDeltaPercent: 4.5,
      },
    ],
  });

  assert.ok(changedMarkdown.includes('# Scenario Tuning Trend'));
  assert.ok(changedMarkdown.includes('Baseline Dashboard Available: yes'));
  assert.ok(changedMarkdown.includes('| prosperous | changed | aaaa1111 → bbbb2222 | +4.50% |'));

  const noChangeMarkdown = buildScenarioTuningTrendMarkdown({
    comparisonSource: 'signature-baseline',
    baselineReference: 'baseline',
    hasBaselineDashboard: false,
    baselineScenarioCount: 0,
    scenarioCount: 1,
    changedCount: 0,
    unchangedCount: 1,
    hasChanges: false,
    scenarios: [],
  });
  assert.ok(noChangeMarkdown.includes('No scenario tuning changes detected.'));
});
