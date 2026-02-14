import test from 'node:test';
import assert from 'node:assert/strict';
import {
  drawTerrainTileSprite,
  resolveTerrainBaseColor,
  resolveTerrainNoiseStrength,
} from '../src/render/spriteTerrainRenderer.js';

test('resolveTerrainBaseColor maps path, dirt, and grass variants', () => {
  assert.equal(resolveTerrainBaseColor('path', 0), '#8a6f4d');
  assert.equal(resolveTerrainBaseColor('dirt', 2), '#6f593f');
  assert.equal(resolveTerrainBaseColor('grass', 0), '#5f8f3a');
  assert.equal(resolveTerrainBaseColor('grass', 5), '#5a8a37');
});

test('resolveTerrainNoiseStrength lowers non-grass noise intensity', () => {
  assert.equal(resolveTerrainNoiseStrength('grass'), 0.12);
  assert.equal(resolveTerrainNoiseStrength('path'), 0.08);
  assert.equal(resolveTerrainNoiseStrength('dirt'), 0.08);
});

test('drawTerrainTileSprite delegates tile and noise rendering with derived values', () => {
  const calls = [];
  const drawTile = (...args) => calls.push(['drawTile', ...args]);
  const drawNoise = (...args) => calls.push(['drawNoise', ...args]);
  const ctx = {};

  drawTerrainTileSprite({
    ctx,
    canvasWidth: 70,
    canvasHeight: 38,
    tileWidth: 64,
    tileHeight: 32,
    kind: 'grass',
    variant: 2,
    deps: { drawTile, drawNoise },
  });

  assert.deepEqual(calls, [
    ['drawTile', ctx, 35, 19, 64, 32, '#64953d', 'rgba(40, 30, 18, 0.2)'],
    ['drawNoise', ctx, 70, 38, 0.12, 5],
  ]);
});

