export function computeFrameDeltaSeconds(now, lastFrameAt, maxDeltaSeconds = 0.12) {
  const rawDeltaSeconds = (now - lastFrameAt) / 1000;
  const safeDeltaSeconds = Number.isFinite(rawDeltaSeconds) ? Math.max(0, rawDeltaSeconds) : 0;
  return Math.min(maxDeltaSeconds, safeDeltaSeconds);
}

export function updateSmoothedFps(previousFps, deltaSeconds, smoothing = 0.9) {
  if (!(deltaSeconds > 0)) {
    return previousFps;
  }
  const safeSmoothing = Math.max(0, Math.min(1, smoothing));
  const instantFps = 1 / deltaSeconds;
  return previousFps * safeSmoothing + instantFps * (1 - safeSmoothing);
}

