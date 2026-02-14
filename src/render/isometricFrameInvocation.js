export function buildIsometricFrameInvocation({ renderer, state, now }) {
  return {
    state,
    now,
    lastFrameAt: renderer.lastFrameAt,
    smoothedFps: renderer.smoothedFps,
    camera: renderer.camera,
    qualityController: renderer.qualityController,
    particles: renderer.particles,
    sampleResourceGains: (nextState, deltaSeconds) => renderer.sampleResourceGains(nextState, deltaSeconds),
    syncBuildingAnimations: (nextState, nextNow) => renderer.syncBuildingAnimations(nextState, nextNow),
    updateColonistInterpolation: (nextState, deltaSeconds) =>
      renderer.updateColonistInterpolation(nextState, deltaSeconds),
    maybeEmitBuildingEffects: (nextState, deltaSeconds) =>
      renderer.maybeEmitBuildingEffects(nextState, deltaSeconds),
    drawBackground: (nextState, width, height, daylight) =>
      renderer.drawBackground(nextState, width, height, daylight),
    drawTerrain: (nextState) => renderer.drawTerrain(nextState),
    drawEntities: (nextState, nextNow, daylight) => renderer.drawEntities(nextState, nextNow, daylight),
    drawPreview: () => renderer.drawPreview(),
    hoveredEntity: renderer.hoveredEntity,
    selectedEntity: renderer.selectedEntity,
    drawSelectionOverlay: (entity, alpha) => renderer.drawSelectionOverlay(entity, alpha),
    getSelectionPulse: (time) => renderer.animations.getSelectionPulse(time),
    ctx: renderer.ctx,
  };
}

