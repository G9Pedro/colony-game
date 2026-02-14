import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveTerrainKind, shouldRefreshTerrainCache } from '../src/render/terrainLayer.js';

test('resolveTerrainKind prioritizes path over nearby building', () => {
  assert.equal(resolveTerrainKind({ onPath: true, nearBuilding: true }), 'path');
  assert.equal(resolveTerrainKind({ onPath: false, nearBuilding: true }), 'dirt');
  assert.equal(resolveTerrainKind({ onPath: false, nearBuilding: false }), 'grass');
});

test('shouldRefreshTerrainCache detects viewport and signature changes', () => {
  const cache = {
    valid: true,
    centerX: 0,
    centerZ: 0,
    zoom: 1,
    minX: -5,
    maxX: 5,
    minZ: -4,
    maxZ: 4,
    buildingSignature: '1:42',
    width: 800,
    height: 600,
    dpr: 1,
  };

  const same = shouldRefreshTerrainCache(cache, {
    centerX: 0.1,
    centerZ: -0.1,
    zoom: 1.01,
    minX: -5,
    maxX: 5,
    minZ: -4,
    maxZ: 4,
    width: 800,
    height: 600,
    dpr: 1,
    signature: '1:42',
  });
  assert.equal(same, false);

  const changedSignature = shouldRefreshTerrainCache(cache, {
    centerX: 0.1,
    centerZ: -0.1,
    zoom: 1.01,
    minX: -5,
    maxX: 5,
    minZ: -4,
    maxZ: 4,
    width: 800,
    height: 600,
    dpr: 1,
    signature: '2:99',
  });
  assert.equal(changedSignature, true);
});

