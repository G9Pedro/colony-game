import test from 'node:test';
import assert from 'node:assert/strict';
import { buildObjectiveHint, buildObjectiveRows } from '../src/ui/objectivesViewState.js';

test('buildObjectiveRows maps objectives with completion and reward labels', () => {
  const rows = buildObjectiveRows({
    objectives: [
      { id: 'o1', title: 'Gather wood', description: 'Collect logs' },
      { id: 'o2', title: 'Build shelter', description: 'Place a house' },
    ],
    completedObjectiveIds: ['o1'],
    rewardMultiplier: 1.25,
    formatObjectiveReward: (objective, multiplier) => `${objective.id}:${multiplier}`,
  });

  assert.deepEqual(rows, [
    {
      id: 'o1',
      title: 'Gather wood',
      description: 'Collect logs',
      completed: true,
      rewardLabel: 'o1:1.25',
    },
    {
      id: 'o2',
      title: 'Build shelter',
      description: 'Place a house',
      completed: false,
      rewardLabel: 'o2:1.25',
    },
  ]);
});

test('buildObjectiveHint renders current objective title or completion message', () => {
  const objectives = [
    { id: 'o1', title: 'Gather wood' },
    { id: 'o2', title: 'Build shelter' },
  ];
  const activeHint = buildObjectiveHint({
    state: { objectives: { completed: [] } },
    objectives,
    getCurrentObjectiveIds: () => ['o2'],
  });
  const doneHint = buildObjectiveHint({
    state: { objectives: { completed: ['o1', 'o2'] } },
    objectives,
    getCurrentObjectiveIds: () => [],
  });

  assert.equal(activeHint, 'Current objective: Build shelter');
  assert.equal(doneHint, 'All objectives complete. Charter victory is within reach.');
});

