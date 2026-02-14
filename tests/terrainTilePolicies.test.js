import test from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveTerrainKind,
  resolveTerrainVariant,
  sampleTerrainTileNoise,
} from '../src/render/terrainTilePolicies.js';

test('resolveTerrainKind prioritizes path then nearby building', () => {
  assert.equal(resolveTerrainKind({ onPath: true, nearBuilding: true }), 'path');
  assert.equal(resolveTerrainKind({ onPath: false, nearBuilding: true }), 'dirt');
  assert.equal(resolveTerrainKind({ onPath: false, nearBuilding: false }), 'grass');
});

test('sampleTerrainTileNoise and resolveTerrainVariant are deterministic', () => {
  const sampleA = sampleTerrainTileNoise(4, -2, 1);
  const sampleB = sampleTerrainTileNoise(4, -2, 1);
  const sampleC = sampleTerrainTileNoise(4, -2, 2);
  assert.equal(sampleA, sampleB);
  assert.notEqual(sampleA, sampleC);

  const variantA = resolveTerrainVariant(3, 7);
  const variantB = resolveTerrainVariant(3, 7);
  assert.equal(variantA, variantB);
  assert.ok(variantA >= 0 && variantA < 4);
});
