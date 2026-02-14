import { createSpriteCanvas, getSpriteContext2D } from './spriteCanvasFactory.js';
import { drawBuildingSpriteCanvas } from './spriteBuildingRenderer.js';
import { drawColonistSprite } from './spriteColonistRenderer.js';
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
  const createCanvas = deps.createCanvas ?? createSpriteCanvas;
  const getContext = deps.getContext ?? getSpriteContext2D;
  const drawTile = deps.drawTile ?? drawTerrainTileSprite;
  const canvas = createCanvas(tileWidth + tilePadding, tileHeight + tilePadding);
  const ctx = getContext(canvas);
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
  const createCanvas = deps.createCanvas ?? createSpriteCanvas;
  const getContext = deps.getContext ?? getSpriteContext2D;
  const drawBuilding = deps.drawBuilding ?? drawBuildingSpriteCanvas;
  const canvas = createCanvas(spriteWidth, spriteHeight);
  const ctx = getContext(canvas);
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
  const createCanvas = deps.createCanvas ?? createSpriteCanvas;
  const getContext = deps.getContext ?? getSpriteContext2D;
  const drawThumbnail = deps.drawThumbnail ?? drawBuildingThumbnail;
  const canvas = createCanvas(size, size);
  const ctx = getContext(canvas);
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
  const createCanvas = deps.createCanvas ?? createSpriteCanvas;
  const getContext = deps.getContext ?? getSpriteContext2D;
  const drawColonist = deps.drawColonist ?? drawColonistSprite;
  const canvas = createCanvas(width, height);
  const ctx = getContext(canvas);
  drawColonist(ctx, { job, frame, idle });
  return canvas;
}

export function createResourceIconEntry({
  resourceKey,
  size,
}, deps = {}) {
  const createCanvas = deps.createCanvas ?? createSpriteCanvas;
  const getContext = deps.getContext ?? getSpriteContext2D;
  const drawResourceIcon = deps.drawResourceIcon ?? drawResourceIconSprite;
  const canvas = createCanvas(size, size);
  const ctx = getContext(canvas);
  drawResourceIcon(ctx, { resourceKey, size });
  return canvas;
}

