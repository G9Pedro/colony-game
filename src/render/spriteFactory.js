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
import { createSpriteCanvas, getSpriteContext2D } from './spriteCanvasFactory.js';
import {
  BUILDING_SPRITE_HEIGHT,
  BUILDING_SPRITE_WIDTH,
  COLONIST_SPRITE_HEIGHT,
  COLONIST_SPRITE_WIDTH,
  DEFAULT_BUILDING_THUMBNAIL_SIZE,
  DEFAULT_RESOURCE_ICON_SIZE,
  TERRAIN_TILE_PADDING,
} from './spriteFactoryLayout.js';
import { drawBuildingSpriteCanvas } from './spriteBuildingRenderer.js';
import { drawColonistSprite } from './spriteColonistRenderer.js';
import { prewarmSpriteFactoryAssets } from './spritePrewarm.js';
import { drawResourceIconSprite } from './spriteResourceIconRenderer.js';
import { createSpriteFactoryRuntimeState } from './spriteFactoryRuntimeState.js';
import { drawTerrainTileSprite } from './spriteTerrainRenderer.js';
import { drawBuildingThumbnail } from './spriteThumbnailRenderer.js';

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
    return getOrCreateCachedSprite(this.terrainTiles, key, () => {
      const canvas = createSpriteCanvas(this.tileWidth + TERRAIN_TILE_PADDING, this.tileHeight + TERRAIN_TILE_PADDING);
      const ctx = getSpriteContext2D(canvas);
      drawTerrainTileSprite({
        ctx,
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        tileWidth: this.tileWidth,
        tileHeight: this.tileHeight,
        kind,
        variant,
      });
      return canvas;
    });
  }

  getBuildingSprite(type, { construction = false } = {}) {
    const key = buildBuildingSpriteCacheKey(type, construction);
    return getOrCreateCachedSprite(this.buildingSprites, key, () => {
      const definition = BUILDING_DEFINITIONS[type];
      const override = BUILDING_STYLE_OVERRIDES[type] ?? {};
      const spriteWidth = BUILDING_SPRITE_WIDTH;
      const spriteHeight = BUILDING_SPRITE_HEIGHT;
      const canvas = createSpriteCanvas(spriteWidth, spriteHeight);
      const ctx = getSpriteContext2D(canvas);
      const spriteMetrics = drawBuildingSpriteCanvas({
        ctx,
        type,
        definition,
        override,
        quality: this.quality,
        construction,
        spriteWidth,
        spriteHeight,
      });

      return {
        canvas,
        ...spriteMetrics,
      };
    });
  }

  getBuildingThumbnail(type, size = DEFAULT_BUILDING_THUMBNAIL_SIZE) {
    const key = buildBuildingThumbnailCacheKey(type, size);
    return getOrCreateCachedSprite(this.buildingSprites, key, () => {
      const source = this.getBuildingSprite(type).canvas;
      const canvas = createSpriteCanvas(size, size);
      const ctx = getSpriteContext2D(canvas);
      drawBuildingThumbnail(ctx, source, size);
      return canvas;
    });
  }

  getColonistSprite(job = 'laborer', frame = 0, { idle = false } = {}) {
    const key = buildColonistSpriteCacheKey(job, frame, idle);
    return getOrCreateCachedSprite(this.colonistSprites, key, () => {
      const canvas = createSpriteCanvas(COLONIST_SPRITE_WIDTH, COLONIST_SPRITE_HEIGHT);
      const ctx = getSpriteContext2D(canvas);
      drawColonistSprite(ctx, { job, frame, idle });
      return canvas;
    });
  }

  getResourceIcon(resourceKey, size = DEFAULT_RESOURCE_ICON_SIZE) {
    const key = buildResourceIconCacheKey(resourceKey, size);
    return getOrCreateCachedSprite(this.resourceIcons, key, () => {
      const canvas = createSpriteCanvas(size, size);
      const ctx = getSpriteContext2D(canvas);
      drawResourceIconSprite(ctx, { resourceKey, size });
      return canvas;
    });
  }
}

