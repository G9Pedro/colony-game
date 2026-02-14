export function buildIsometricPlacementEffectInvocation(renderer, state, now) {
  return {
    buildings: state.buildings,
    knownBuildingIds: renderer.knownBuildingIds,
    now,
    animations: renderer.animations,
    effectsEnabled: renderer.options.effectsEnabled,
    particles: renderer.particles,
  };
}

export function buildIsometricResourceGainEffectInvocation(renderer, gains, state) {
  return {
    gains,
    state,
    effectsEnabled: renderer.options.effectsEnabled,
    shouldRunOptionalEffects: renderer.qualityController.shouldRunOptionalEffects(),
    particles: renderer.particles,
    camera: renderer.camera,
  };
}

export function buildIsometricAmbientEffectInvocation(renderer, state, deltaSeconds) {
  return {
    state,
    deltaSeconds,
    effectsEnabled: renderer.options.effectsEnabled,
    shouldRunOptionalEffects: renderer.qualityController.shouldRunOptionalEffects(),
    qualityMultiplier: renderer.qualityController.getParticleMultiplier(),
    particles: renderer.particles,
  };
}

