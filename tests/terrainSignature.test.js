import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTerrainSignature } from '../src/render/terrainSignature.js';

test('buildTerrainSignature is stable for identical structure payloads', () => {
  const structures = [
    { x: 4, z: -2, type: 'house' },
    { x: -1, z: 3, type: 'farm' },
  ];
  const a = buildTerrainSignature({}, {
    collectStructures: () => structures.slice(),
  });
  const b = buildTerrainSignature({}, {
    collectStructures: () => structures.slice().reverse(),
  });
  assert.equal(a, b);
});

test('buildTerrainSignature changes with structure count/type changes', () => {
  const base = buildTerrainSignature({}, {
    collectStructures: () => [{ x: 0, z: 0, type: 'hut' }],
  });
  const changed = buildTerrainSignature({}, {
    collectStructures: () => [{ x: 0, z: 0, type: 'farm' }],
  });
  assert.notEqual(base, changed);
});
