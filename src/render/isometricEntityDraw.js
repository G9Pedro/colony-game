import { buildEntityRenderPass } from './entityRenderPass.js';

export function drawIsometricEntityPass({
  state,
  now,
  daylight,
  camera,
  spriteFactory,
  animations,
  particles,
  colonistRenderState,
  ctx,
  setInteractiveEntities,
  buildRenderPass = buildEntityRenderPass,
  compareDepth = (left, right) => left.depth - right.depth,
}) {
  const pass = buildRenderPass({
    state,
    now,
    daylight,
    camera,
    spriteFactory,
    animations,
    particles,
    colonistRenderState,
  });
  setInteractiveEntities(pass.interactiveEntities);

  const renderables = [...pass.renderables].sort(compareDepth);
  renderables.forEach((item) => item.draw(ctx));

  return {
    interactiveEntities: pass.interactiveEntities,
    renderCount: renderables.length,
  };
}

