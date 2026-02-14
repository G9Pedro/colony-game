export function buildIsometricFrameContext({
  now,
  lastFrameAt,
  smoothedFps,
  state,
  camera,
  computeFrameDeltaSeconds,
  updateSmoothedFps,
  getDaylightFactor,
  maxDeltaSeconds = 0.12,
  fpsSmoothing = 0.9,
}) {
  const deltaSeconds = computeFrameDeltaSeconds(now, lastFrameAt, maxDeltaSeconds);
  const nextSmoothedFps = updateSmoothedFps(smoothedFps, deltaSeconds, fpsSmoothing);
  return {
    now,
    deltaSeconds,
    nextLastFrameAt: now,
    nextSmoothedFps,
    width: camera.viewportWidth,
    height: camera.viewportHeight,
    daylight: getDaylightFactor(state.timeSeconds),
  };
}

