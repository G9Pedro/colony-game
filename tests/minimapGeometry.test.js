import test from 'node:test';
import assert from 'node:assert/strict';
import { minimapPointToWorld, worldToMinimapPoint } from '../src/ui/minimapGeometry.js';

test('worldToMinimapPoint maps world center and corners', () => {
  assert.deepEqual(worldToMinimapPoint({
    x: 0,
    z: 0,
    worldRadius: 30,
    width: 120,
    height: 120,
  }), { x: 60, y: 60 });

  assert.deepEqual(worldToMinimapPoint({
    x: 30,
    z: -30,
    worldRadius: 30,
    width: 120,
    height: 120,
  }), { x: 120, y: 0 });
});

test('minimapPointToWorld round-trips with worldToMinimapPoint', () => {
  const minimap = worldToMinimapPoint({
    x: -12,
    z: 18,
    worldRadius: 30,
    width: 200,
    height: 100,
  });
  const world = minimapPointToWorld({
    x: minimap.x,
    y: minimap.y,
    worldRadius: 30,
    width: 200,
    height: 100,
  });

  assert.ok(Math.abs(world.x - (-12)) < 0.001);
  assert.ok(Math.abs(world.z - 18) < 0.001);
});

test('worldToMinimapPoint clamps out-of-bounds world coordinates', () => {
  const point = worldToMinimapPoint({
    x: 999,
    z: -999,
    worldRadius: 30,
    width: 100,
    height: 80,
  });
  assert.deepEqual(point, { x: 100, y: 0 });
});

