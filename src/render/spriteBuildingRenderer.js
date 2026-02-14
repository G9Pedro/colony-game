import { drawBuildingDecoration } from './spriteBuildingDecorations.js';
import { drawScaffoldOverlay, drawTextureNoise } from './spriteEffects.js';
import { shadeColor } from './spriteMath.js';
import { drawDiamond, drawIsoPrism } from './spritePrimitives.js';

export function buildBuildingSpriteGeometry({
  definition,
  override = {},
  spriteWidth = 160,
  spriteHeight = 160,
} = {}) {
  const footprintScale = override.footprint ?? 1;
  const heightScale = override.height ?? 0.85;
  const centerX = spriteWidth * 0.5;
  const baseY = spriteHeight - 44;
  const width = Math.max(38, definition.size[0] * 22 * footprintScale);
  const depth = Math.max(18, definition.size[2] * 11 * footprintScale);
  const height = Math.max(18, definition.size[1] * 18 * heightScale);
  return {
    centerX,
    baseY,
    width,
    depth,
    height,
  };
}

export function drawBuildingSpriteCanvas({
  ctx,
  type,
  definition,
  override = {},
  quality = 'balanced',
  construction = false,
  spriteWidth = 160,
  spriteHeight = 160,
  deps = {},
}) {
  const shade = deps.shade ?? shadeColor;
  const drawTile = deps.drawTile ?? drawDiamond;
  const drawPrism = deps.drawPrism ?? drawIsoPrism;
  const drawNoise = deps.drawNoise ?? drawTextureNoise;
  const drawDecoration = deps.drawDecoration ?? drawBuildingDecoration;
  const drawScaffold = deps.drawScaffold ?? drawScaffoldOverlay;

  const roofColor = override.roof ?? '#9a5f3b';
  const wallColor = override.wall ?? '#a18b73';
  const geometry = buildBuildingSpriteGeometry({
    definition,
    override,
    spriteWidth,
    spriteHeight,
  });

  const {
    centerX,
    baseY,
    width,
    depth,
    height,
  } = geometry;

  ctx.fillStyle = 'rgba(12, 10, 7, 0.17)';
  ctx.beginPath();
  ctx.ellipse(centerX, baseY + depth * 0.48, width * 0.5, depth * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();

  drawTile(ctx, centerX, baseY, width, depth, shade(wallColor, 0.68), 'rgba(35, 23, 12, 0.22)');
  const prism = drawPrism(ctx, {
    cx: centerX,
    baseY,
    width,
    depth,
    height,
    topColor: shade(roofColor, 1.1),
    leftColor: shade(wallColor, 0.88),
    rightColor: shade(wallColor, 0.74),
  });
  drawNoise(ctx, spriteWidth, spriteHeight, quality === 'high' ? 0.2 : 0.09, width + depth);
  drawDecoration(ctx, type, centerX, baseY, width, depth, prism.topCenterY);

  if (construction) {
    drawScaffold(ctx, spriteWidth, spriteHeight);
    ctx.fillStyle = 'rgba(234, 211, 156, 0.24)';
    ctx.fillRect(0, 0, spriteWidth, spriteHeight);
  }

  return {
    anchorX: centerX,
    anchorY: baseY + depth * 0.5 + 2,
    width,
    depth,
  };
}

