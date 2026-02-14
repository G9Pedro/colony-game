import { RESOURCE_GLYPHS } from './spriteFactoryConstants.js';

export function resolveResourceGlyph(resourceKey, resourceGlyphs = RESOURCE_GLYPHS) {
  return resourceGlyphs[resourceKey] ?? '●';
}

export function drawResourceIconSprite(ctx, {
  resourceKey,
  size = 20,
  resourceGlyphs = RESOURCE_GLYPHS,
} = {}) {
  ctx.fillStyle = 'rgba(82, 53, 28, 0.85)';
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, 6);
  ctx.fill();

  ctx.fillStyle = 'rgba(255, 243, 219, 0.95)';
  ctx.font = `${Math.floor(size * 0.72)}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(resolveResourceGlyph(resourceKey, resourceGlyphs), size * 0.5, size * 0.54);
}

