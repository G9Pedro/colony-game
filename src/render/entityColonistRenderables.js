import { computeColonistBobOffset, getColonistAnimationFrame } from './entityAnimationPolicies.js';
import { createColonistInteractiveEntity } from './entityRenderPolicies.js';
import { isRectVisibleInViewport } from './entityVisibility.js';

export function appendColonistRenderables({
  state,
  camera,
  spriteFactory,
  colonistRenderState,
  renderables,
  interactiveEntities,
}) {
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
}
