import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildTerrainLayerCacheSnapshot,
  createTerrainLayerCacheState,
  createTerrainLayerRefreshPayload,
} from '../src/render/terrainLayerCache.js';

test('createTerrainLayerCacheState returns default invalid cache payload', () => {
  assert.deepEqual(createTerrainLayerCacheState(), {
    valid: false,
    centerX: 0,
    centerZ: 0,
    zoom: 0,
    minX: 0,
    maxX: 0,
    minZ: 0,
    maxZ: 0,
    buildingSignature: '',
    width: 0,
    height: 0,
    dpr: 1,
  });
});

test('terrain layer cache helpers map camera/bounds/signature payloads', () => {
  const camera = {
    centerX: 4,
    centerZ: -3,
    zoom: 1.2,
    viewportWidth: 900,
    viewportHeight: 700,
  };
  const bounds = {
    minX: -10,
    maxX: 12,
    minZ: -8,
    maxZ: 6,
  };
  assert.deepEqual(buildTerrainLayerCacheSnapshot({
    camera,
    bounds,
    dpr: 2,
    signature: '3:42',
  }), {
    valid: true,
    centerX: 4,
    centerZ: -3,
    zoom: 1.2,
    minX: -10,
    maxX: 12,
    minZ: -8,
    maxZ: 6,
    buildingSignature: '3:42',
    width: 900,
    height: 700,
    dpr: 2,
  });

  assert.deepEqual(createTerrainLayerRefreshPayload({
    camera,
    bounds,
    dpr: 2,
    signature: '3:42',
  }), {
    centerX: 4,
    centerZ: -3,
    zoom: 1.2,
    minX: -10,
    maxX: 12,
    minZ: -8,
    maxZ: 6,
    width: 900,
    height: 700,
    dpr: 2,
    signature: '3:42',
  });
});
