import { computeFrameDeltaSeconds, updateSmoothedFps } from './frameTiming.js';
import { buildIsometricFrameContext } from './isometricFrameContext.js';
import { runIsometricFrameDraw } from './isometricFrameDraw.js';
import { runIsometricFrameDynamics } from './isometricFrameDynamics.js';
import { drawTimeAndSeasonOverlays } from './overlayPainter.js';
import { getDaylightFactor, getSeasonTint } from './stateVisuals.js';

export function runIsometricFrame({
  state,
  now,
  lastFrameAt,
  smoothedFps,
  camera,
  qualityController,
  particles,
  sampleResourceGains,
  syncBuildingAnimations,
  updateColonistInterpolation,
  maybeEmitBuildingEffects,
  drawBackground,
  drawTerrain,
  drawEntities,
  drawPreview,
  hoveredEntity,
  selectedEntity,
  drawSelectionOverlay,
  getSelectionPulse,
  ctx,
  maxDeltaSeconds = 0.12,
  fpsSmoothing = 0.9,
  computeFrameDeltaSecondsFn = computeFrameDeltaSeconds,
  updateSmoothedFpsFn = updateSmoothedFps,
  getDaylightFactorFn = getDaylightFactor,
  getSeasonTintFn = getSeasonTint,
  drawTimeAndSeasonOverlaysFn = drawTimeAndSeasonOverlays,
  buildFrameContext = buildIsometricFrameContext,
  runFrameDynamics = runIsometricFrameDynamics,
  runFrameDraw = runIsometricFrameDraw,
}) {
  const frame = buildFrameContext({
    now,
    lastFrameAt,
    smoothedFps,
    state,
    camera,
    computeFrameDeltaSeconds: computeFrameDeltaSecondsFn,
    updateSmoothedFps: updateSmoothedFpsFn,
    getDaylightFactor: getDaylightFactorFn,
    maxDeltaSeconds,
    fpsSmoothing,
  });

  runFrameDynamics({
    state,
    frame,
    qualityController,
    camera,
    particles,
    sampleResourceGains,
    syncBuildingAnimations,
    updateColonistInterpolation,
    maybeEmitBuildingEffects,
  });

  runFrameDraw({
    state,
    frame,
    drawBackground,
    drawTerrain,
    drawEntities,
    drawPreview,
    hoveredEntity,
    selectedEntity,
    drawSelectionOverlay,
    getSelectionPulse,
    drawTimeAndSeasonOverlays: drawTimeAndSeasonOverlaysFn,
    ctx,
    getSeasonTint: getSeasonTintFn,
  });

  return frame;
}

