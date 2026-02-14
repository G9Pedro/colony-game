import { BUILDING_DEFINITIONS } from '../content/buildings.js';
import {
  BUILDING_STYLE_OVERRIDES,
  PREWARM_JOB_TYPES,
  PREWARM_RESOURCE_KEYS,
} from './spriteFactoryConstants.js';
import { getOrCreateCachedSprite } from './spriteCache.js';
import {
  buildBuildingSpriteCacheKey,
  buildBuildingThumbnailCacheKey,
  buildColonistSpriteCacheKey,
  buildResourceIconCacheKey,
  buildTerrainTileCacheKey,
} from './spriteCacheKeys.js';
import {
  BUILDING_SPRITE_HEIGHT,
  BUILDING_SPRITE_WIDTH,
  COLONIST_SPRITE_HEIGHT,
  COLONIST_SPRITE_WIDTH,
  DEFAULT_BUILDING_THUMBNAIL_SIZE,
  DEFAULT_RESOURCE_ICON_SIZE,
  TERRAIN_TILE_PADDING,
} from './spriteFactoryLayout.js';
import {
  createBuildingSpriteEntry,
  createBuildingThumbnailEntry,
  createColonistSpriteEntry,
  createResourceIconEntry,
  createTerrainTileEntry,
} from './spriteFactoryEntries.js';
import { prewarmSpriteFactoryAssets } from './spritePrewarm.js';
import { createSpriteFactoryRuntimeState } from './spriteFactoryRuntimeState.js';

export class SpriteFactory {
  constructor({ quality = 'balanced' } = {}) {
    Object.assign(this, createSpriteFactoryRuntimeState({ quality }));
  }

  prewarm(buildingDefinitions = BUILDING_DEFINITIONS) {
    prewarmSpriteFactoryAssets({
      spriteFactory: this,
      buildingDefinitions,
      prewarmJobTypes: PREWARM_JOB_TYPES,
      prewarmResourceKeys: PREWARM_RESOURCE_KEYS,
    });
  }

  getTerrainTile(kind = 'grass', variant = 0) {
    const key = buildTerrainTileCacheKey(kind, variant);
    return getOrCreateCachedSprite(this.terrainTiles, key, () =>
      createTerrainTileEntry({
        tileWidth: this.tileWidth,
        tileHeight: this.tileHeight,
        tilePadding: TERRAIN_TILE_PADDING,
        kind,
        variant,
      }));
  }

  getBuildingSprite(type, { construction = false } = {}) {
    const key = buildBuildingSpriteCacheKey(type, construction);
    return getOrCreateCachedSprite(this.buildingSprites, key, () =>
      createBuildingSpriteEntry({
        type,
        construction,
        quality: this.quality,
        spriteWidth: BUILDING_SPRITE_WIDTH,
        spriteHeight: BUILDING_SPRITE_HEIGHT,
        buildingDefinitions: BUILDING_DEFINITIONS,
        buildingStyleOverrides: BUILDING_STYLE_OVERRIDES,
      }));
  }

  getBuildingThumbnail(type, size = DEFAULT_BUILDING_THUMBNAIL_SIZE) {
    const key = buildBuildingThumbnailCacheKey(type, size);
    return getOrCreateCachedSprite(this.buildingSprites, key, () =>
      createBuildingThumbnailEntry({
        source: this.getBuildingSprite(type).canvas,
        size,
      }));
  }

  getColonistSprite(job = 'laborer', frame = 0, { idle = false } = {}) {
    const key = buildColonistSpriteCacheKey(job, frame, idle);
    return getOrCreateCachedSprite(this.colonistSprites, key, () =>
      createColonistSpriteEntry({
        job,
        frame,
        idle,
        width: COLONIST_SPRITE_WIDTH,
        height: COLONIST_SPRITE_HEIGHT,
      }));
  }

  getResourceIcon(resourceKey, size = DEFAULT_RESOURCE_ICON_SIZE) {
    const key = buildResourceIconCacheKey(resourceKey, size);
    return getOrCreateCachedSprite(this.resourceIcons, key, () =>
      createResourceIconEntry({
        resourceKey,
        size,
      }));
  }
}

