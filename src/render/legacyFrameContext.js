export function buildLegacyFrameContext({
  now,
  lastFrameAt,
  smoothedFps,
  computeFrameDeltaSeconds,
  updateSmoothedFps,
  maxDeltaSeconds = 0.2,
  fpsSmoothing = 0.9,
}) {
  const deltaSeconds = computeFrameDeltaSeconds(now, lastFrameAt, maxDeltaSeconds);
  const nextSmoothedFps = updateSmoothedFps(smoothedFps, deltaSeconds, fpsSmoothing);
  return {
    now,
    deltaSeconds,
    nextLastFrameAt: now,
    nextSmoothedFps,
  };
}

