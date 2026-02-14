import { buildLegacyFrameContext } from './legacyFrameContext.js';
import { computeFrameDeltaSeconds, updateSmoothedFps } from './frameTiming.js';

export function runLegacyFrame({
  state,
  now,
  lastFrameAt,
  smoothedFps,
  syncBuildings,
  syncColonists,
  renderScene,
  buildFrameContext = buildLegacyFrameContext,
  computeFrameDeltaSecondsFn = computeFrameDeltaSeconds,
  updateSmoothedFpsFn = updateSmoothedFps,
  maxDeltaSeconds = 0.2,
  fpsSmoothing = 0.9,
}) {
  const frame = buildFrameContext({
    now,
    lastFrameAt,
    smoothedFps,
    computeFrameDeltaSeconds: computeFrameDeltaSecondsFn,
    updateSmoothedFps: updateSmoothedFpsFn,
    maxDeltaSeconds,
    fpsSmoothing,
  });
  syncBuildings(state);
  syncColonists(state);
  renderScene();
  return frame;
}

