import { drawBuildingSpriteCanvas } from './spriteBuildingRenderer.js';
import { drawColonistSprite } from './spriteColonistRenderer.js';
import { createSpriteEntrySurface } from './spriteEntrySurface.js';
import { drawResourceIconSprite } from './spriteResourceIconRenderer.js';
import { drawTerrainTileSprite } from './spriteTerrainRenderer.js';
import { drawBuildingThumbnail } from './spriteThumbnailRenderer.js';

export function createTerrainTileEntry({
  tileWidth,
  tileHeight,
  tilePadding,
  kind,
  variant,
}, deps = {}) {
  const drawTile = deps.drawTile ?? drawTerrainTileSprite;
  const { canvas, ctx } = createSpriteEntrySurface({
    width: tileWidth + tilePadding,
    height: tileHeight + tilePadding,
  }, deps);
  drawTile({
    ctx,
    canvasWidth: canvas.width,
    canvasHeight: canvas.height,
    tileWidth,
    tileHeight,
    kind,
    variant,
  });
  return canvas;
}

export function createBuildingSpriteEntry({
  type,
  construction,
  quality,
  spriteWidth,
  spriteHeight,
  buildingDefinitions,
  buildingStyleOverrides,
}, deps = {}) {
  const drawBuilding = deps.drawBuilding ?? drawBuildingSpriteCanvas;
  const { canvas, ctx } = createSpriteEntrySurface({
    width: spriteWidth,
    height: spriteHeight,
  }, deps);
  const definition = buildingDefinitions[type];
  const override = buildingStyleOverrides[type] ?? {};
  const spriteMetrics = drawBuilding({
    ctx,
    type,
    definition,
    override,
    quality,
    construction,
    spriteWidth,
    spriteHeight,
  });

  return {
    canvas,
    ...spriteMetrics,
  };
}

export function createBuildingThumbnailEntry({
  source,
  size,
}, deps = {}) {
  const drawThumbnail = deps.drawThumbnail ?? drawBuildingThumbnail;
  const { canvas, ctx } = createSpriteEntrySurface({
    width: size,
    height: size,
  }, deps);
  drawThumbnail(ctx, source, size);
  return canvas;
}

export function createColonistSpriteEntry({
  job,
  frame,
  idle,
  width,
  height,
}, deps = {}) {
  const drawColonist = deps.drawColonist ?? drawColonistSprite;
  const { canvas, ctx } = createSpriteEntrySurface({ width, height }, deps);
  drawColonist(ctx, { job, frame, idle });
  return canvas;
}

export function createResourceIconEntry({
  resourceKey,
  size,
}, deps = {}) {
  const drawResourceIcon = deps.drawResourceIcon ?? drawResourceIconSprite;
  const { canvas, ctx } = createSpriteEntrySurface({
    width: size,
    height: size,
  }, deps);
  drawResourceIcon(ctx, { resourceKey, size });
  return canvas;
}

