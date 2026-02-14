import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRunStatsPanelViewModel } from '../src/ui/runStatsPanelViewState.js';

test('buildRunStatsPanelViewModel maps metrics warning and history rows', () => {
  const panel = buildRunStatsPanelViewModel({
    metrics: {
      peakPopulation: 22,
      buildingsConstructed: 14,
      researchCompleted: 6,
      objectivesCompleted: 3,
      deaths: 1,
    },
    debug: {
      invariantViolations: [{ message: 'Storage mismatch' }],
    },
    runSummaryHistory: [
      {
        id: 'run-1',
        outcome: 'lost',
        day: 11,
        scenarioId: 'valley',
        balanceProfileId: 'hard',
        peakPopulation: 10,
        buildingsConstructed: 8,
      },
      {
        id: 'run-2',
        outcome: 'won',
        day: 18,
        scenarioId: 'plains',
        balanceProfileId: null,
        peakPopulation: 18,
        buildingsConstructed: 12,
      },
    ],
  }, 2);

  assert.equal(panel.metricsRows.length, 5);
  assert.equal(panel.warningMessage, 'Invariant warning: Storage mismatch');
  assert.deepEqual(panel.historyRows, [
    {
      id: 'run-2',
      outcomeLabel: 'Victory',
      dayLabel: 'Day 18',
      summary: 'plains/standard · peak 18 · 12 builds',
    },
    {
      id: 'run-1',
      outcomeLabel: 'Defeat',
      dayLabel: 'Day 11',
      summary: 'valley/hard · peak 10 · 8 builds',
    },
  ]);
});

test('buildRunStatsPanelViewModel handles missing warnings and history', () => {
  const panel = buildRunStatsPanelViewModel({
    metrics: {
      peakPopulation: 0,
      buildingsConstructed: 0,
      researchCompleted: 0,
      objectivesCompleted: 0,
      deaths: 0,
    },
    debug: {},
    runSummaryHistory: [],
  });

  assert.equal(panel.warningMessage, null);
  assert.deepEqual(panel.historyRows, []);
});

