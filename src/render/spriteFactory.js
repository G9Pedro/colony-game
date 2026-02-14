import { BUILDING_DEFINITIONS } from '../content/buildings.js';
import {
  BUILDING_STYLE_OVERRIDES,
  PREWARM_JOB_TYPES,
  PREWARM_RESOURCE_KEYS,
  RESOURCE_GLYPHS,
} from './spriteFactoryConstants.js';
import { createSpriteCanvas, getSpriteContext2D } from './spriteCanvasFactory.js';
import { shadeColor } from './spriteMath.js';
import { drawDiamond, drawIsoPrism } from './spritePrimitives.js';
import { drawScaffoldOverlay, drawTextureNoise } from './spriteEffects.js';
import { drawBuildingDecoration } from './spriteBuildingDecorations.js';
import { drawColonistSprite } from './spriteColonistRenderer.js';
import { drawTerrainTileSprite } from './spriteTerrainRenderer.js';

export class SpriteFactory {
  constructor({ quality = 'balanced' } = {}) {
    this.quality = quality;
    this.tileWidth = 64;
    this.tileHeight = 32;
    this.buildingSprites = new Map();
    this.colonistSprites = new Map();
    this.terrainTiles = new Map();
    this.resourceIcons = new Map();
  }

  prewarm(buildingDefinitions = BUILDING_DEFINITIONS) {
    for (const building of Object.values(buildingDefinitions)) {
      this.getBuildingSprite(building.id);
      this.getBuildingSprite(building.id, { construction: true });
    }

    for (let variant = 0; variant < 4; variant += 1) {
      this.getTerrainTile('grass', variant);
    }
    this.getTerrainTile('dirt', 0);
    this.getTerrainTile('path', 0);

    PREWARM_JOB_TYPES.forEach((job) => {
      for (let frame = 0; frame < 3; frame += 1) {
        this.getColonistSprite(job, frame, { idle: false });
        this.getColonistSprite(job, frame, { idle: true });
      }
    });

    PREWARM_RESOURCE_KEYS.forEach((resource) => {
      this.getResourceIcon(resource, 20);
    });
  }

  getTerrainTile(kind = 'grass', variant = 0) {
    const key = `${kind}:${variant}`;
    if (this.terrainTiles.has(key)) {
      return this.terrainTiles.get(key);
    }
    const canvas = createSpriteCanvas(this.tileWidth + 6, this.tileHeight + 6);
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
    this.terrainTiles.set(key, canvas);
    return canvas;
  }

  getBuildingSprite(type, { construction = false } = {}) {
    const key = `${type}:${construction ? 'construction' : 'complete'}`;
    if (this.buildingSprites.has(key)) {
      return this.buildingSprites.get(key);
    }

    const definition = BUILDING_DEFINITIONS[type];
    const override = BUILDING_STYLE_OVERRIDES[type] ?? {};
    const roofColor = override.roof ?? '#9a5f3b';
    const wallColor = override.wall ?? '#a18b73';
    const footprintScale = override.footprint ?? 1;
    const heightScale = override.height ?? 0.85;
    const spriteWidth = 160;
    const spriteHeight = 160;
    const canvas = createSpriteCanvas(spriteWidth, spriteHeight);
    const ctx = getSpriteContext2D(canvas);

    const centerX = spriteWidth * 0.5;
    const baseY = spriteHeight - 44;
    const width = Math.max(38, definition.size[0] * 22 * footprintScale);
    const depth = Math.max(18, definition.size[2] * 11 * footprintScale);
    const height = Math.max(18, definition.size[1] * 18 * heightScale);

    ctx.fillStyle = 'rgba(12, 10, 7, 0.17)';
    ctx.beginPath();
    ctx.ellipse(centerX, baseY + depth * 0.48, width * 0.5, depth * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();

    drawDiamond(ctx, centerX, baseY, width, depth, shadeColor(wallColor, 0.68), 'rgba(35, 23, 12, 0.22)');
    const prism = drawIsoPrism(ctx, {
      cx: centerX,
      baseY,
      width,
      depth,
      height,
      topColor: shadeColor(roofColor, 1.1),
      leftColor: shadeColor(wallColor, 0.88),
      rightColor: shadeColor(wallColor, 0.74),
    });
    drawTextureNoise(ctx, spriteWidth, spriteHeight, this.quality === 'high' ? 0.2 : 0.09, width + depth);
    drawBuildingDecoration(ctx, type, centerX, baseY, width, depth, prism.topCenterY);

    if (construction) {
      drawScaffoldOverlay(ctx, spriteWidth, spriteHeight);
      ctx.fillStyle = 'rgba(234, 211, 156, 0.24)';
      ctx.fillRect(0, 0, spriteWidth, spriteHeight);
    }

    const sprite = {
      canvas,
      anchorX: centerX,
      anchorY: baseY + depth * 0.5 + 2,
      width,
      depth,
    };
    this.buildingSprites.set(key, sprite);
    return sprite;
  }

  getBuildingThumbnail(type, size = 56) {
    const key = `${type}:thumb:${size}`;
    if (this.buildingSprites.has(key)) {
      return this.buildingSprites.get(key);
    }
    const source = this.getBuildingSprite(type).canvas;
    const canvas = createSpriteCanvas(size, size);
    const ctx = getSpriteContext2D(canvas);
    ctx.drawImage(source, 22, 26, source.width - 44, source.height - 34, 0, 0, size, size);
    this.buildingSprites.set(key, canvas);
    return canvas;
  }

  getColonistSprite(job = 'laborer', frame = 0, { idle = false } = {}) {
    const key = `${job}:${frame}:${idle ? 1 : 0}`;
    if (this.colonistSprites.has(key)) {
      return this.colonistSprites.get(key);
    }

    const canvas = createSpriteCanvas(24, 30);
    const ctx = getSpriteContext2D(canvas);
    drawColonistSprite(ctx, { job, frame, idle });

    this.colonistSprites.set(key, canvas);
    return canvas;
  }

  getResourceIcon(resourceKey, size = 20) {
    const key = `${resourceKey}:${size}`;
    if (this.resourceIcons.has(key)) {
      return this.resourceIcons.get(key);
    }

    const canvas = createSpriteCanvas(size, size);
    const ctx = getSpriteContext2D(canvas);
    ctx.fillStyle = 'rgba(82, 53, 28, 0.85)';
    ctx.beginPath();
    ctx.roundRect(0, 0, size, size, 6);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 243, 219, 0.95)';
    ctx.font = `${Math.floor(size * 0.72)}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(RESOURCE_GLYPHS[resourceKey] ?? '●', size * 0.5, size * 0.54);
    this.resourceIcons.set(key, canvas);
    return canvas;
  }
}

