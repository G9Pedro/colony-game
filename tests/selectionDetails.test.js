import test from 'node:test';
import assert from 'node:assert/strict';
import { buildBuildingSelectionDetails, buildColonistSelectionDetails } from '../src/ui/selectionDetails.js';

test('buildBuildingSelectionDetails returns rows for known building', () => {
  const details = buildBuildingSelectionDetails(
    { id: 'building-1', type: 'building' },
    {
      buildings: [{ id: 'building-1', type: 'farm', health: 93, workersAssigned: 2, isOperational: true }],
      constructionQueue: [],
      colonists: [{ id: 'c-1', name: 'Aria', alive: true, assignedBuildingId: 'building-1' }],
    },
    {
      farm: {
        name: 'Farm',
        category: 'production',
        inputPerWorker: { water: 0.2 },
        outputPerWorker: { food: 2.1 },
      },
    },
  );

  assert.equal(details.title, 'Farm');
  assert.equal(details.rows.some((row) => row.label === 'Workers' && row.value === '2'), true);
  assert.equal(details.rows.some((row) => row.label === 'Assigned' && row.value.includes('Aria')), true);
  assert.equal(details.message, null);
});

test('buildBuildingSelectionDetails returns fallback message when missing', () => {
  const details = buildBuildingSelectionDetails(
    { id: 'missing-building', type: 'building' },
    { buildings: [], constructionQueue: [], colonists: [] },
    {},
  );
  assert.equal(details.message, 'Building data unavailable.');
  assert.equal(details.rows.length, 0);
});

test('buildColonistSelectionDetails returns colonist detail rows', () => {
  const details = buildColonistSelectionDetails(
    { id: 'colonist-1', type: 'colonist' },
    {
      colonists: [{
        id: 'colonist-1',
        name: 'Bennett',
        job: 'builder',
        task: 'Working',
        assignedBuildingId: 'building-2',
        needs: { morale: 71.2, hunger: 60.8, health: 88.1 },
      }],
    },
  );
  assert.equal(details.title, 'Bennett');
  assert.equal(details.rows.some((row) => row.label === 'Assigned Building' && row.value === 'building-2'), true);
  assert.equal(details.message, null);
});

