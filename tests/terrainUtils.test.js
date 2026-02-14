import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPathTileSet, buildStructureTileSet, buildTerrainSignature, getTerrainBoundsFromCorners } from '../src/render/terrainUtils.js';

function buildState({ buildings = [], constructionQueue = [] } = {}) {
  return { buildings, constructionQueue };
}

test('getTerrainBoundsFromCorners applies integer padding bounds', () => {
  const bounds = getTerrainBoundsFromCorners([
    { x: -2.2, z: 3.1 },
    { x: 4.6, z: 1.9 },
    { x: 0.2, z: -4.7 },
  ], 2);
  assert.deepEqual(bounds, {
    minX: -5,
    maxX: 7,
    minZ: -7,
    maxZ: 6,
  });
});

test('buildTerrainSignature is stable across structure ordering', () => {
  const stateA = buildState({
    buildings: [
      { x: 5, z: -1, type: 'house' },
      { x: -3, z: 4, type: 'farm' },
    ],
    constructionQueue: [
      { x: 2, z: 2, type: 'workshop' },
    ],
  });
  const stateB = buildState({
    buildings: [
      { x: -3, z: 4, type: 'farm' },
      { x: 5, z: -1, type: 'house' },
    ],
    constructionQueue: [
      { x: 2, z: 2, type: 'workshop' },
    ],
  });
  assert.equal(buildTerrainSignature(stateA), buildTerrainSignature(stateB));
});

test('buildStructureTileSet merges buildings and construction tiles', () => {
  const tileSet = buildStructureTileSet(buildState({
    buildings: [{ x: 0.2, z: 1.7, type: 'hut' }],
    constructionQueue: [{ x: -1.9, z: 4.1, type: 'watchtower' }],
  }));
  assert.equal(tileSet.has('0:2'), true);
  assert.equal(tileSet.has('-2:4'), true);
});

test('buildPathTileSet creates connective tiles between nearest structures', () => {
  const pathTiles = buildPathTileSet(buildState({
    buildings: [{ x: 0, z: 0, type: 'hut' }, { x: 2, z: 0, type: 'farm' }],
  }));
  assert.equal(pathTiles.has('0:0'), true);
  assert.equal(pathTiles.has('1:0'), true);
  assert.equal(pathTiles.has('2:0'), true);
});

