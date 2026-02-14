export function applyRendererFrameState(renderer, frame) {
  renderer.lastFrameAt = frame.nextLastFrameAt;
  renderer.smoothedFps = frame.nextSmoothedFps;
}

