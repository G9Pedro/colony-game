import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildTerrainLayerCameraCorners,
  resolveTerrainLayerBounds,
} from '../src/render/terrainLayerBounds.js';

test('buildTerrainLayerCameraCorners projects viewport corners into world coordinates', () => {
  const calls = [];
  const camera = {
    viewportWidth: 800,
    viewportHeight: 500,
    screenToWorld: (x, y) => {
      calls.push([x, y]);
      return { x: x / 10, z: y / 10 };
    },
  };
  const corners = buildTerrainLayerCameraCorners(camera);
  assert.deepEqual(calls, [
    [0, 0],
    [800, 0],
    [0, 500],
    [800, 500],
  ]);
  assert.deepEqual(corners, [
    { x: 0, z: 0 },
    { x: 80, z: 0 },
    { x: 0, z: 50 },
    { x: 80, z: 50 },
  ]);
});

test('resolveTerrainLayerBounds forwards generated corners and padding to bound resolver', () => {
  const camera = {
    viewportWidth: 10,
    viewportHeight: 20,
    screenToWorld: (x, y) => ({ x, z: y }),
  };
  const bounds = resolveTerrainLayerBounds(camera, 5, {
    getBounds: (corners, padding) => {
      assert.equal(corners.length, 4);
      assert.equal(padding, 5);
      return { minX: -1, maxX: 2, minZ: -3, maxZ: 4 };
    },
  });
  assert.deepEqual(bounds, { minX: -1, maxX: 2, minZ: -3, maxZ: 4 });
});
