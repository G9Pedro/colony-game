import test from 'node:test';
import assert from 'node:assert/strict';
import { buildStructureTileSet, collectStructurePoints } from '../src/render/terrainStructures.js';

test('collectStructurePoints rounds building and construction coordinates', () => {
  const state = {
    buildings: [{ x: 1.6, z: -2.2, type: 'house' }],
    constructionQueue: [{ x: -3.1, z: 4.8, type: 'farm' }],
  };
  assert.deepEqual(collectStructurePoints(state), [
    { x: 2, z: -2, type: 'house' },
    { x: -3, z: 5, type: 'farm' },
  ]);
});

test('buildStructureTileSet supports injected structure collector', () => {
  const tileSet = buildStructureTileSet({}, {
    collectStructures: () => [
      { x: 0, z: 0 },
      { x: 1, z: -1 },
    ],
  });
  assert.equal(tileSet.has('0:0'), true);
  assert.equal(tileSet.has('1:-1'), true);
});
