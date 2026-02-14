import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildMetricsSummaryRows,
  getLatestInvariantWarning,
  getRecentRunHistory,
  getRunOutcomeLabel,
} from '../src/ui/runStatsView.js';

test('buildMetricsSummaryRows maps metrics into UI row shape', () => {
  const rows = buildMetricsSummaryRows({
    peakPopulation: 12,
    buildingsConstructed: 8,
    researchCompleted: 4,
    objectivesCompleted: 3,
    deaths: 1,
  });
  assert.deepEqual(rows, [
    { label: 'Peak Population', value: 12 },
    { label: 'Built Structures', value: 8 },
    { label: 'Research Completed', value: 4 },
    { label: 'Objectives Completed', value: 3 },
    { label: 'Deaths', value: 1 },
  ]);
});

test('run stats helpers return latest warning and recent history slice', () => {
  const warning = getLatestInvariantWarning({
    invariantViolations: [{ message: 'old' }, { message: 'newest' }],
  });
  assert.deepEqual(warning, { message: 'newest' });

  const history = getRecentRunHistory(
    [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }],
    3,
  );
  assert.deepEqual(history, [{ id: 4 }, { id: 3 }, { id: 2 }]);
});

test('getRunOutcomeLabel maps known outcomes', () => {
  assert.equal(getRunOutcomeLabel('won'), 'Victory');
  assert.equal(getRunOutcomeLabel('lost'), 'Defeat');
  assert.equal(getRunOutcomeLabel('unknown'), 'Defeat');
});

