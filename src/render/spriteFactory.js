import { BUILDING_DEFINITIONS } from '../content/buildings.js';
import {
  BUILDING_STYLE_OVERRIDES,
  JOB_COLORS,
  PREWARM_JOB_TYPES,
  PREWARM_RESOURCE_KEYS,
  RESOURCE_GLYPHS,
} from './spriteFactoryConstants.js';
import { createSpriteCanvas, getSpriteContext2D } from './spriteCanvasFactory.js';
import { shadeColor } from './spriteMath.js';
import { drawDiamond, drawIsoPrism } from './spritePrimitives.js';
import { drawScaffoldOverlay, drawTextureNoise } from './spriteEffects.js';

function drawBuildingDecoration(ctx, type, cx, baseY, footprintW, footprintH, topY) {
  ctx.save();
  switch (type) {
    case 'farm': {
      ctx.strokeStyle = 'rgba(108, 84, 30, 0.55)';
      ctx.lineWidth = 1.2;
      for (let idx = -3; idx <= 3; idx += 1) {
        const offset = idx * (footprintW / 10);
        ctx.beginPath();
        ctx.moveTo(cx - footprintW * 0.38 + offset, baseY + footprintH * 0.35);
        ctx.lineTo(cx - footprintW * 0.2 + offset, baseY + footprintH * 0.48);
        ctx.stroke();
      }
      break;
    }
    case 'lumberCamp': {
      ctx.fillStyle = '#7a4b2c';
      for (let idx = 0; idx < 4; idx += 1) {
        const x = cx + footprintW * 0.18 + idx * 5;
        const y = baseY + 8 + (idx % 2) * 3;
        ctx.beginPath();
        ctx.arc(x, y, 3.3, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'quarry': {
      ctx.fillStyle = '#8d97a4';
      ctx.beginPath();
      ctx.moveTo(cx - 10, baseY + 8);
      ctx.lineTo(cx - 2, baseY + 2);
      ctx.lineTo(cx + 4, baseY + 8);
      ctx.lineTo(cx - 2, baseY + 13);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'ironMine': {
      ctx.fillStyle = 'rgba(15, 16, 24, 0.65)';
      ctx.beginPath();
      ctx.ellipse(cx, baseY + footprintH * 0.22, 12, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#8b6d4c';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - 11, baseY + footprintH * 0.22);
      ctx.lineTo(cx - 11, baseY + footprintH * 0.44);
      ctx.moveTo(cx + 11, baseY + footprintH * 0.22);
      ctx.lineTo(cx + 11, baseY + footprintH * 0.44);
      ctx.stroke();
      break;
    }
    case 'workshop': {
      ctx.fillStyle = '#5d6370';
      ctx.fillRect(cx + 10, topY - 20, 7, 20);
      ctx.fillStyle = 'rgba(230, 229, 231, 0.45)';
      ctx.fillRect(cx + 11, topY - 27, 5, 8);
      break;
    }
    case 'clinic': {
      ctx.strokeStyle = '#f0f4ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - 5, topY + 10);
      ctx.lineTo(cx + 5, topY + 10);
      ctx.moveTo(cx, topY + 5);
      ctx.lineTo(cx, topY + 15);
      ctx.stroke();
      break;
    }
    case 'school':
    case 'library': {
      ctx.fillStyle = 'rgba(255, 245, 220, 0.85)';
      ctx.fillRect(cx - 9, topY + 8, 5, 8);
      ctx.fillRect(cx - 1, topY + 8, 5, 8);
      ctx.fillRect(cx + 7, topY + 8, 5, 8);
      break;
    }
    case 'shrine': {
      ctx.fillStyle = '#e3d8a7';
      ctx.beginPath();
      ctx.moveTo(cx, topY - 14);
      ctx.lineTo(cx + 6, topY + 3);
      ctx.lineTo(cx - 6, topY + 3);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'watchtower': {
      ctx.fillStyle = '#d6b24a';
      ctx.beginPath();
      ctx.moveTo(cx + 4, topY - 8);
      ctx.lineTo(cx + 4, topY - 24);
      ctx.lineTo(cx + 15, topY - 20);
      ctx.lineTo(cx + 4, topY - 16);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'warehouse': {
      ctx.fillStyle = '#6f4a28';
      for (let idx = -2; idx <= 2; idx += 1) {
        ctx.fillRect(cx + idx * 5 - 2, baseY + 8 + Math.abs(idx), 5, 4);
      }
      break;
    }
    case 'apartment': {
      ctx.fillStyle = 'rgba(244, 238, 221, 0.72)';
      for (let row = 0; row < 3; row += 1) {
        for (let col = -2; col <= 2; col += 1) {
          ctx.fillRect(cx + col * 5, topY + 10 + row * 8, 3, 5);
        }
      }
      break;
    }
    default:
      break;
  }
  ctx.restore();
}

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
    const cx = canvas.width * 0.5;
    const cy = canvas.height * 0.5;

    const baseColor = kind === 'path'
      ? '#8a6f4d'
      : kind === 'dirt'
        ? '#6f593f'
        : ['#5f8f3a', '#5a8a37', '#64953d', '#588634'][variant % 4];
    drawDiamond(ctx, cx, cy, this.tileWidth, this.tileHeight, baseColor, 'rgba(40, 30, 18, 0.2)');
    drawTextureNoise(ctx, canvas.width, canvas.height, kind === 'grass' ? 0.12 : 0.08, variant + 3);
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
    const color = JOB_COLORS[job] ?? JOB_COLORS.laborer;
    const x = 12;
    const y = 18;
    const legSwing = idle ? 0 : (frame % 3 === 1 ? -1.5 : frame % 3 === 2 ? 1.5 : 0);
    const bodyLift = idle ? Math.sin(frame * 0.8) * 0.6 : 0;

    ctx.fillStyle = 'rgba(20, 18, 14, 0.22)';
    ctx.beginPath();
    ctx.ellipse(x, y + 9.5, 5.5, 2.8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = shadeColor(color, 0.7);
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(x - 2, y + 4);
    ctx.lineTo(x - 3.5 + legSwing, y + 10.5);
    ctx.moveTo(x + 2, y + 4);
    ctx.lineTo(x + 3.5 - legSwing, y + 10.5);
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x - 3.8, y - 3.5 + bodyLift, 7.6, 9.3, 3.3);
    ctx.fill();

    ctx.fillStyle = '#f1cfb3';
    ctx.beginPath();
    ctx.arc(x, y - 6 + bodyLift, 3.3, 0, Math.PI * 2);
    ctx.fill();

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

