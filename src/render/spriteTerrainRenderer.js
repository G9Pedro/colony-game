import { drawTextureNoise } from './spriteEffects.js';
import { drawDiamond } from './spritePrimitives.js';

const GRASS_VARIANT_COLORS = Object.freeze(['#5f8f3a', '#5a8a37', '#64953d', '#588634']);

export function resolveTerrainBaseColor(kind = 'grass', variant = 0) {
  if (kind === 'path') {
    return '#8a6f4d';
  }
  if (kind === 'dirt') {
    return '#6f593f';
  }
  return GRASS_VARIANT_COLORS[variant % GRASS_VARIANT_COLORS.length];
}

export function resolveTerrainNoiseStrength(kind = 'grass') {
  return kind === 'grass' ? 0.12 : 0.08;
}

export function drawTerrainTileSprite({
  ctx,
  canvasWidth,
  canvasHeight,
  tileWidth,
  tileHeight,
  kind = 'grass',
  variant = 0,
  deps = {},
}) {
  const drawTile = deps.drawTile ?? drawDiamond;
  const drawNoise = deps.drawNoise ?? drawTextureNoise;
  const cx = canvasWidth * 0.5;
  const cy = canvasHeight * 0.5;
  const baseColor = resolveTerrainBaseColor(kind, variant);

  drawTile(ctx, cx, cy, tileWidth, tileHeight, baseColor, 'rgba(40, 30, 18, 0.2)');
  drawNoise(ctx, canvasWidth, canvasHeight, resolveTerrainNoiseStrength(kind), variant + 3);
}

