import {
  computeConstructionProgress,
  createBuildingInteractiveEntity,
  createColonistInteractiveEntity,
  shouldRenderNightWindowGlow,
} from './entityRenderPolicies.js';
import { computeColonistBobOffset, getColonistAnimationFrame } from './entityAnimationPolicies.js';
import { traceRoundedRectPath } from './canvasShapes.js';
import { isRectVisibleInViewport } from './entityVisibility.js';

export { isRectVisibleInViewport };

export function buildEntityRenderPass({
  state,
  now,
  daylight,
  camera,
  spriteFactory,
  animations,
  particles,
  colonistRenderState,
}) {
  const interactiveEntities = [];
  const renderables = [];

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

  state.colonists.forEach((colonist) => {
    if (!colonist.alive) {
      return;
    }
    const renderState = colonistRenderState.get(colonist.id);
    if (!renderState) {
      return;
    }
    const frame = getColonistAnimationFrame(state.timeSeconds, colonist.age);
    const idle = colonist.task !== 'Working';
    const sprite = spriteFactory.getColonistSprite(colonist.job, frame, { idle });
    const bob = computeColonistBobOffset(state.timeSeconds, colonist.age, idle);
    const screen = camera.worldToScreen(renderState.x, renderState.z);
    const drawW = sprite.width * camera.zoom;
    const drawH = sprite.height * camera.zoom;
    const drawX = screen.x - drawW * 0.5;
    const drawY = screen.y - drawH * 0.8 - bob * camera.zoom;
    if (!isRectVisibleInViewport({
      x: drawX,
      y: drawY,
      width: drawW,
      height: drawH,
      viewportWidth: camera.viewportWidth,
      viewportHeight: camera.viewportHeight,
      padding: 36,
    })) {
      return;
    }
    renderables.push({
      depth: renderState.x + renderState.z + 0.28,
      draw: (ctx) => {
        ctx.drawImage(sprite, drawX, drawY, drawW, drawH);
      },
    });

    interactiveEntities.push(createColonistInteractiveEntity({
      colonist,
      renderState,
      screen,
      drawW,
      drawH,
      depth: renderState.x + renderState.z + 0.28,
    }));
  });

  renderables.push(...particles.buildRenderables(camera));

  return {
    renderables,
    interactiveEntities,
  };
}

