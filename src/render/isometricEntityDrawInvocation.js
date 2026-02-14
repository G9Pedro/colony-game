export function buildIsometricEntityDrawInvocation(renderer, state, now, daylight) {
  return {
    state,
    now,
    daylight,
    camera: renderer.camera,
    spriteFactory: renderer.spriteFactory,
    animations: renderer.animations,
    particles: renderer.particles,
    colonistRenderState: renderer.colonistRenderState,
    ctx: renderer.ctx,
    setInteractiveEntities: (interactiveEntities) => {
      renderer.interactiveEntities = interactiveEntities;
    },
  };
}

