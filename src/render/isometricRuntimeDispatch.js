import { updateColonistRenderState } from './colonistInterpolation.js';
import {
  runIsometricAmbientEffects,
  runIsometricPlacementEffectSync,
  runIsometricResourceGainSampling,
} from './isometricEffectDispatch.js';

export function dispatchIsometricPlacementAnimationSync(renderer, state, now, deps = {}) {
  const runPlacementSync = deps.runPlacementSync ?? runIsometricPlacementEffectSync;
  const knownBuildingIds = runPlacementSync(renderer, state, now);
  renderer.knownBuildingIds = knownBuildingIds;
  return knownBuildingIds;
}

export function dispatchIsometricColonistInterpolation(renderer, state, deltaSeconds, deps = {}) {
  const updateInterpolation = deps.updateInterpolation ?? updateColonistRenderState;
  updateInterpolation(state.colonists, renderer.colonistRenderState, deltaSeconds);
}

export function dispatchIsometricResourceGainSampling(renderer, state, deltaSeconds, deps = {}) {
  const runSampling = deps.runSampling ?? runIsometricResourceGainSampling;
  runSampling(renderer, state, deltaSeconds);
}

export function dispatchIsometricAmbientEffects(renderer, state, deltaSeconds, deps = {}) {
  const runAmbient = deps.runAmbient ?? runIsometricAmbientEffects;
  runAmbient(renderer, state, deltaSeconds);
}

