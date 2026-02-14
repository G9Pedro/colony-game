import test from 'node:test';
import assert from 'node:assert/strict';
import { diffNewBuildingPlacements } from '../src/render/buildingPlacementTracker.js';

test('diffNewBuildingPlacements tracks newly seen buildings', () => {
  const known = new Set(['b1']);
  const { nextIds, newBuildings } = diffNewBuildingPlacements([
    { id: 'b1', x: 0, z: 0 },
    { id: 'b2', x: 2, z: -1 },
  ], known);

  assert.deepEqual([...nextIds], ['b1', 'b2']);
  assert.deepEqual(newBuildings.map((building) => building.id), ['b2']);
});

test('diffNewBuildingPlacements returns no new buildings when ids are known', () => {
  const known = new Set(['b1', 'b2']);
  const { nextIds, newBuildings } = diffNewBuildingPlacements([
    { id: 'b1', x: 0, z: 0 },
    { id: 'b2', x: 1, z: 1 },
  ], known);

  assert.deepEqual([...nextIds], ['b1', 'b2']);
  assert.deepEqual(newBuildings, []);
});

