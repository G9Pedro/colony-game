import { getBuildingDecorationHandler } from './spriteBuildingDecorationHandlers.js';

export function drawBuildingDecoration(ctx, type, cx, baseY, footprintW, footprintH, topY) {
  ctx.save();
  const renderDecoration = getBuildingDecorationHandler(type);
  renderDecoration?.({
    ctx,
    cx,
    baseY,
    footprintW,
    footprintH,
    topY,
  });
  ctx.restore();
}

