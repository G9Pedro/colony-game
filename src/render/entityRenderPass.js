import {
  appendBuildingRenderables,
  appendColonistRenderables,
  appendConstructionRenderables,
} from './entityRenderables.js';
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

  appendConstructionRenderables({
    state,
    camera,
    spriteFactory,
    renderables,
  });
  appendBuildingRenderables({
    state,
    now,
    daylight,
    camera,
    spriteFactory,
    animations,
    renderables,
    interactiveEntities,
  });
  appendColonistRenderables({
    state,
    camera,
    spriteFactory,
    colonistRenderState,
    renderables,
    interactiveEntities,
  });

  renderables.push(...particles.buildRenderables(camera));

  return {
    renderables,
    interactiveEntities,
  };
}

