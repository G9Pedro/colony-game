import {
  emitAmbientBuildingEffects,
  maybeEmitResourceGainFloatingText,
  syncPlacementAnimationEffects,
} from './isometricRuntimeEffects.js';
import {
  buildIsometricAmbientEffectInvocation,
  buildIsometricPlacementEffectInvocation,
  buildIsometricResourceGainEffectInvocation,
} from './isometricEffectInvocations.js';

export function runIsometricPlacementEffectSync(renderer, state, now, deps = {}) {
  const buildInvocation = deps.buildInvocation ?? buildIsometricPlacementEffectInvocation;
  const syncEffects = deps.syncEffects ?? syncPlacementAnimationEffects;
  return syncEffects(buildInvocation(renderer, state, now));
}

export function runIsometricResourceGainSampling(renderer, state, deltaSeconds, deps = {}) {
  const buildInvocation = deps.buildInvocation ?? buildIsometricResourceGainEffectInvocation;
  const emitFloatingText = deps.emitFloatingText ?? maybeEmitResourceGainFloatingText;
  const gains = renderer.resourceGainTracker.sample(state.resources, deltaSeconds);
  emitFloatingText(buildInvocation(renderer, gains, state));
}

export function runIsometricAmbientEffects(renderer, state, deltaSeconds, deps = {}) {
  const buildInvocation = deps.buildInvocation ?? buildIsometricAmbientEffectInvocation;
  const emitAmbient = deps.emitAmbient ?? emitAmbientBuildingEffects;
  emitAmbient(buildInvocation(renderer, state, deltaSeconds));
}

