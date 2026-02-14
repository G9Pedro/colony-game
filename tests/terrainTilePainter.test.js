import test from 'node:test';
import assert from 'node:assert/strict';
import { paintTerrainTiles } from '../src/render/terrainTilePainter.js';

test('paintTerrainTiles maps tile kinds from path/structure sets and draws each visible tile', () => {
  const drawCalls = [];
  const tileCalls = [];
  const ctx = {
    drawImage: (...args) => {
      drawCalls.push(args);
    },
  };
  const spriteFactory = {
    getTerrainTile: (kind, variant) => {
      tileCalls.push([kind, variant]);
      return { width: 12, height: 6, kind, variant };
    },
  };
  paintTerrainTiles({
    ctx,
    state: { maxWorldRadius: 1 },
    camera: {
      worldToScreen: (x, z) => ({ x: x * 10, y: z * 10 }),
    },
    spriteFactory,
    bounds: {
      minX: -1,
      maxX: 1,
      minZ: -1,
      maxZ: 1,
    },
    structureTileSet: new Set(['0:0']),
    pathTileSet: new Set(['1:0']),
  });

  assert.equal(drawCalls.length, 9);
  assert.ok(tileCalls.some(([kind]) => kind === 'path'));
  assert.ok(tileCalls.some(([kind]) => kind === 'dirt'));
  assert.ok(tileCalls.some(([kind]) => kind === 'grass'));
});
