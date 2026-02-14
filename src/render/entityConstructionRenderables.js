import { computeConstructionProgress } from './entityRenderPolicies.js';
import { traceRoundedRectPath } from './canvasShapes.js';
import { isRectVisibleInViewport } from './entityVisibility.js';

export function appendConstructionRenderables({
  state,
  camera,
  spriteFactory,
  renderables,
}) {
  state.constructionQueue.forEach((item) => {
    const sprite = spriteFactory.getBuildingSprite(item.type, { construction: true });
    const completeSprite = spriteFactory.getBuildingSprite(item.type, { construction: false });
    const screen = camera.worldToScreen(item.x, item.z);
    const progress = computeConstructionProgress(item.progress, item.buildTime);
    const drawX = screen.x - sprite.anchorX * camera.zoom;
    const drawY = screen.y - sprite.anchorY * camera.zoom;
    const drawW = sprite.canvas.width * camera.zoom;
    const drawH = sprite.canvas.height * camera.zoom;
    if (!isRectVisibleInViewport({
      x: drawX,
      y: drawY,
      width: drawW,
      height: drawH,
      viewportWidth: camera.viewportWidth,
      viewportHeight: camera.viewportHeight,
    })) {
      return;
    }
    renderables.push({
      depth: item.x + item.z + 0.04,
      draw: (ctx) => {
        ctx.save();
        ctx.globalAlpha = 0.95;
        ctx.drawImage(sprite.canvas, drawX, drawY, drawW, drawH);

        ctx.save();
        ctx.beginPath();
        ctx.rect(drawX, drawY + drawH * (1 - progress), drawW, drawH * progress);
        ctx.clip();
        ctx.drawImage(completeSprite.canvas, drawX, drawY, drawW, drawH);
        ctx.restore();

        const barW = 40 * camera.zoom;
        const barH = 5 * camera.zoom;
        const barX = screen.x - barW * 0.5;
        const barY = screen.y - drawH * 0.42;
        traceRoundedRectPath(ctx, barX, barY, barW, barH, 3);
        ctx.fillStyle = 'rgba(38, 31, 24, 0.75)';
        ctx.fill();
        traceRoundedRectPath(ctx, barX, barY, barW * progress, barH, 3);
        ctx.fillStyle = 'rgba(89, 183, 120, 0.95)';
        ctx.fill();
        ctx.restore();
      },
    });
  });
}
