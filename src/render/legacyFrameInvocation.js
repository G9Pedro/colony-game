export function buildLegacyFrameInvocation({ renderer, state, now }) {
  return {
    state,
    now,
    lastFrameAt: renderer.lastFrameAt,
    smoothedFps: renderer.smoothedFps,
    syncBuildings: (nextState) => renderer.syncBuildings(nextState),
    syncColonists: (nextState) => renderer.syncColonists(nextState),
    renderScene: () => renderer.renderer.render(renderer.scene, renderer.camera),
  };
}

