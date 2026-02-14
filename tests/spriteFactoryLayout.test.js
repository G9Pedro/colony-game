import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BUILDING_SPRITE_HEIGHT,
  BUILDING_SPRITE_WIDTH,
  COLONIST_SPRITE_HEIGHT,
  COLONIST_SPRITE_WIDTH,
  DEFAULT_BUILDING_THUMBNAIL_SIZE,
  DEFAULT_RESOURCE_ICON_SIZE,
  DEFAULT_TILE_HEIGHT,
  DEFAULT_TILE_WIDTH,
  PREWARM_COLONIST_FRAME_COUNT,
  PREWARM_TERRAIN_GRASS_VARIANTS,
  TERRAIN_TILE_PADDING,
} from '../src/render/spriteFactoryLayout.js';

test('sprite factory layout constants expose expected sprite dimensions', () => {
  assert.equal(DEFAULT_TILE_WIDTH, 64);
  assert.equal(DEFAULT_TILE_HEIGHT, 32);
  assert.equal(TERRAIN_TILE_PADDING, 6);
  assert.equal(BUILDING_SPRITE_WIDTH, 160);
  assert.equal(BUILDING_SPRITE_HEIGHT, 160);
  assert.equal(COLONIST_SPRITE_WIDTH, 24);
  assert.equal(COLONIST_SPRITE_HEIGHT, 30);
  assert.equal(DEFAULT_BUILDING_THUMBNAIL_SIZE, 56);
  assert.equal(DEFAULT_RESOURCE_ICON_SIZE, 20);
});

test('sprite prewarm loop constants remain deterministic', () => {
  assert.equal(PREWARM_TERRAIN_GRASS_VARIANTS, 4);
  assert.equal(PREWARM_COLONIST_FRAME_COUNT, 3);
});

