import test from 'node:test';
import assert from 'node:assert/strict';
import { prewarmSpriteFactoryAssets } from '../src/render/spritePrewarm.js';

test('prewarmSpriteFactoryAssets invokes sprite factory warmup paths', () => {
  const calls = [];
  const spriteFactory = {
    getBuildingSprite: (...args) => calls.push(['building', ...args]),
    getTerrainTile: (...args) => calls.push(['terrain', ...args]),
    getColonistSprite: (...args) => calls.push(['colonist', ...args]),
    getResourceIcon: (...args) => calls.push(['resource', ...args]),
  };
  prewarmSpriteFactoryAssets({
    spriteFactory,
    buildingDefinitions: {
      hut: { id: 'hut' },
      farm: { id: 'farm' },
    },
    prewarmJobTypes: ['laborer', 'builder'],
    prewarmResourceKeys: ['wood'],
  });

  const buildingCalls = calls.filter((call) => call[0] === 'building');
  const terrainCalls = calls.filter((call) => call[0] === 'terrain');
  const colonistCalls = calls.filter((call) => call[0] === 'colonist');
  const resourceCalls = calls.filter((call) => call[0] === 'resource');

  assert.equal(buildingCalls.length, 4);
  assert.deepEqual(terrainCalls.map((call) => call.slice(1)), [
    ['grass', 0],
    ['grass', 1],
    ['grass', 2],
    ['grass', 3],
    ['dirt', 0],
    ['path', 0],
  ]);
  assert.equal(colonistCalls.length, 12);
  assert.deepEqual(resourceCalls, [['resource', 'wood', 20]]);
});

