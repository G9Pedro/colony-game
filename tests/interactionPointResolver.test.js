import test from 'node:test';
import assert from 'node:assert/strict';
import { mapClientToLocalPoint, resolveInteractionPoint } from '../src/render/interactionPointResolver.js';

test('mapClientToLocalPoint converts viewport coordinates to local canvas point', () => {
  const rect = { left: 120, top: 60 };
  const local = mapClientToLocalPoint(200, 145, rect);
  assert.deepEqual(local, { x: 80, y: 85 });
});

test('resolveInteractionPoint maps client position to local/world/tile values', () => {
  const cameraCalls = [];
  const camera = {
    screenToWorld: (x, y) => {
      cameraCalls.push(['world', x, y]);
      return { x: x / 10, z: y / 20 };
    },
    screenToTile: (x, y) => {
      cameraCalls.push(['tile', x, y]);
      return { x: Math.floor(x), z: Math.floor(y) };
    },
  };
  const canvas = {
    getBoundingClientRect: () => ({
      left: 15,
      top: 25,
    }),
  };

  const point = resolveInteractionPoint({
    camera,
    canvas,
    clientX: 45,
    clientY: 95,
  });

  assert.deepEqual(point, {
    local: { x: 30, y: 70 },
    world: { x: 3, z: 3.5 },
    tile: { x: 30, z: 70 },
  });
  assert.deepEqual(cameraCalls, [
    ['world', 30, 70],
    ['tile', 30, 70],
  ]);
});

