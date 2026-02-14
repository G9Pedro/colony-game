import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildBuildingSpriteCacheKey,
  buildBuildingThumbnailCacheKey,
  buildColonistSpriteCacheKey,
  buildResourceIconCacheKey,
  buildTerrainTileCacheKey,
} from '../src/render/spriteCacheKeys.js';

test('buildTerrainTileCacheKey includes tile kind and variant', () => {
  assert.equal(buildTerrainTileCacheKey('grass', 2), 'grass:2');
});

test('buildBuildingSpriteCacheKey includes construction state label', () => {
  assert.equal(buildBuildingSpriteCacheKey('farm', false), 'farm:complete');
  assert.equal(buildBuildingSpriteCacheKey('farm', true), 'farm:construction');
});

test('buildBuildingThumbnailCacheKey, colonist, and resource keys remain stable', () => {
  assert.equal(buildBuildingThumbnailCacheKey('hut', 64), 'hut:thumb:64');
  assert.equal(buildColonistSpriteCacheKey('builder', 2, true), 'builder:2:1');
  assert.equal(buildColonistSpriteCacheKey('builder', 2, false), 'builder:2:0');
  assert.equal(buildResourceIconCacheKey('wood', 20), 'wood:20');
});

