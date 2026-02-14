import {
  createBuildingInteractiveEntity,
  shouldRenderNightWindowGlow,
} from './entityRenderPolicies.js';
import { traceRoundedRectPath } from './canvasShapes.js';
import { isRectVisibleInViewport } from './entityVisibility.js';

export function appendBuildingRenderables({
  state,
  now,
  daylight,
  camera,
  spriteFactory,
  animations,
  renderables,
  interactiveEntities,
}) {
  state.buildings.forEach((building) => {
    const sprite = spriteFactory.getBuildingSprite(building.type);
    const screen = camera.worldToScreen(building.x, building.z);
    const scale = animations.getPlacementScale(building.id, now) * camera.zoom;
    const drawW = sprite.canvas.width * scale;
    const drawH = sprite.canvas.height * scale;
    const drawX = screen.x - sprite.anchorX * scale;
    const drawY = screen.y - sprite.anchorY * scale;
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
    const isNight = 1 - daylight;
    renderables.push({
      depth: building.x + building.z + 0.15,
      draw: (ctx) => {
        ctx.drawImage(sprite.canvas, drawX, drawY, drawW, drawH);
        if (shouldRenderNightWindowGlow(daylight, building.type)) {
          ctx.save();
          ctx.globalAlpha = isNight * 0.35;
          ctx.fillStyle = 'rgba(255, 195, 116, 0.65)';
          traceRoundedRectPath(
            ctx,
            drawX + drawW * 0.42,
            drawY + drawH * 0.44,
            drawW * 0.17,
            drawH * 0.14,
            4,
          );
          ctx.fill();
          ctx.restore();
        }
      },
    });

    interactiveEntities.push(createBuildingInteractiveEntity({
      building,
      screen,
      drawW,
      drawH,
      depth: building.x + building.z + 0.15,
    }));
  });
}
