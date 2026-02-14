export function runIsometricFrameDynamics({
  state,
  frame,
  qualityController,
  camera,
  particles,
  sampleResourceGains,
  syncBuildingAnimations,
  updateColonistInterpolation,
  maybeEmitBuildingEffects,
}) {
  qualityController.recordFrame(frame.deltaSeconds);
  camera.setWorldRadius(state.maxWorldRadius);
  camera.update(frame.deltaSeconds);
  particles.setQuality(qualityController.getParticleMultiplier());
  particles.update(frame.deltaSeconds);
  sampleResourceGains(state, frame.deltaSeconds);
  syncBuildingAnimations(state, frame.now);
  updateColonistInterpolation(state, frame.deltaSeconds);
  maybeEmitBuildingEffects(state, frame.deltaSeconds);
}

