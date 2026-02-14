import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPathTileSet } from '../src/render/terrainPathing.js';

test('buildPathTileSet returns empty set when less than two structures exist', () => {
  const tiles = buildPathTileSet({}, {
    collectStructures: () => [{ x: 0, z: 0 }],
  });
  assert.equal(tiles.size, 0);
});

test('buildPathTileSet creates manhattan path to nearest structure', () => {
  const tiles = buildPathTileSet({}, {
    collectStructures: () => [
      { x: 0, z: 0 },
      { x: 2, z: 1 },
    ],
  });
  assert.equal(tiles.has('0:0'), true);
  assert.equal(tiles.has('1:0'), true);
  assert.equal(tiles.has('2:0'), true);
  assert.equal(tiles.has('2:1'), true);
});
