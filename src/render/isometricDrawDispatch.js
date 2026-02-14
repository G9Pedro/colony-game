import { drawIsometricEntityPass } from './isometricEntityDraw.js';
import { buildIsometricEntityDrawInvocation } from './isometricEntityDrawInvocation.js';
import { drawBackgroundLayer, drawPlacementPreview, drawSelectionHighlight } from './overlayPainter.js';

export function dispatchIsometricBackgroundDraw(renderer, width, height, daylight, deps = {}) {
  const drawBackground = deps.drawBackground ?? drawBackgroundLayer;
  drawBackground(renderer.ctx, width, height, daylight);
}

export function dispatchIsometricTerrainDraw(renderer, state) {
  renderer.terrainLayer.draw(renderer.ctx, state, renderer.camera, renderer.devicePixelRatio);
}

export function dispatchIsometricPreviewDraw(renderer, deps = {}) {
  const drawPreview = deps.drawPreview ?? drawPlacementPreview;
  drawPreview(renderer.ctx, renderer.camera, renderer.preview);
}

export function dispatchIsometricSelectionDraw(renderer, entity, pulseAlpha, deps = {}) {
  const drawSelection = deps.drawSelection ?? drawSelectionHighlight;
  drawSelection(renderer.ctx, renderer.camera, entity, pulseAlpha);
}

export function dispatchIsometricEntityDraw(renderer, state, now, daylight, deps = {}) {
  const buildInvocation = deps.buildInvocation ?? buildIsometricEntityDrawInvocation;
  const drawEntities = deps.drawEntities ?? drawIsometricEntityPass;
  return drawEntities(buildInvocation(renderer, state, now, daylight));
}

