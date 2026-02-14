import test from 'node:test';
import assert from 'node:assert/strict';
import { buildColonistRows, buildConstructionQueueRows } from '../src/ui/colonyPanelsViewState.js';

test('buildConstructionQueueRows returns normalized queue display rows', () => {
  const rows = buildConstructionQueueRows(
    [
      { id: 'q1', type: 'farm', progress: 2, buildTime: 4 },
      { type: 'unknown-hut', x: 1, z: 2, progress: 1, buildTime: 5 },
    ],
    { farm: { name: 'Farm' } },
    (part, whole) => (part / whole) * 100,
  );

  assert.deepEqual(rows, [
    { id: 'q1', name: 'Farm', progress: 50 },
    { id: 'unknown-hut:1:2', name: 'unknown-hut', progress: 20 },
  ]);
});

test('buildColonistRows filters dead colonists, truncates to limit, and rounds needs', () => {
  const colonists = [
    {
      id: 'c1',
      name: 'Ari',
      job: 'builder',
      task: 'Hauling',
      alive: true,
      needs: { health: 97.8, hunger: 58.2, rest: 40.9, morale: 76.6 },
    },
    {
      id: 'c2',
      name: 'Bo',
      job: 'farmer',
      task: 'Planting',
      alive: false,
      needs: { health: 100, hunger: 100, rest: 100, morale: 100 },
    },
    {
      id: 'c3',
      name: 'Cy',
      job: 'miner',
      task: 'Mining',
      alive: true,
      needs: { health: 80.4, hunger: 62.7, rest: 49.1, morale: 68.9 },
    },
  ];

  const rows = buildColonistRows(colonists, 1);

  assert.deepEqual(rows, [
    {
      id: 'c1',
      name: 'Ari',
      job: 'builder',
      task: 'Hauling',
      health: 97,
      hunger: 58,
      rest: 40,
      morale: 76,
    },
  ]);
});

