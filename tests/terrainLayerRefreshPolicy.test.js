import test from 'node:test';
import assert from 'node:assert/strict';
import {
  hasTerrainLayerBoundsChanged,
  shouldRefreshTerrainCache,
} from '../src/render/terrainLayerRefreshPolicy.js';

test('hasTerrainLayerBoundsChanged reports boundary drift', () => {
  const cache = { minX: -4, maxX: 5, minZ: -3, maxZ: 6 };
  assert.equal(hasTerrainLayerBoundsChanged(cache, {
    minX: -4,
    maxX: 5,
    minZ: -3,
    maxZ: 6,
  }), false);
  assert.equal(hasTerrainLayerBoundsChanged(cache, {
    minX: -4,
    maxX: 6,
    minZ: -3,
    maxZ: 6,
  }), true);
});

test('shouldRefreshTerrainCache reacts to invalid/cache-shape/signature deltas', () => {
  const baseCache = {
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
  const basePayload = {
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
  };

  assert.equal(shouldRefreshTerrainCache({ ...baseCache, valid: false }, basePayload), true);
  assert.equal(shouldRefreshTerrainCache(baseCache, basePayload), false);
  assert.equal(shouldRefreshTerrainCache(baseCache, { ...basePayload, width: 801 }), true);
  assert.equal(shouldRefreshTerrainCache(baseCache, { ...basePayload, dpr: 2 }), true);
  assert.equal(shouldRefreshTerrainCache(baseCache, { ...basePayload, centerX: 0.8 }), true);
  assert.equal(shouldRefreshTerrainCache(baseCache, { ...basePayload, zoom: 1.2 }), true);
  assert.equal(shouldRefreshTerrainCache(baseCache, { ...basePayload, minX: -6 }), true);
  assert.equal(shouldRefreshTerrainCache(baseCache, { ...basePayload, signature: '2:11' }), true);
});
