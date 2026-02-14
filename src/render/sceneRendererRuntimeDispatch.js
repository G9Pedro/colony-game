const SCENE_RENDERER_AVAILABLE_MODES = Object.freeze(['isometric', 'three']);

export function getSceneRendererAvailableModes() {
  return [...SCENE_RENDERER_AVAILABLE_MODES];
}

export function centerSceneRendererOnBuilding(renderer, building) {
  renderer.activeRenderer?.centerOnBuilding(building);
}

export function resizeSceneRenderer(renderer) {
  renderer.activeRenderer?.resize();
}

export function renderSceneRendererFrame(renderer, state) {
  renderer.lastState = state;
  renderer.activeRenderer.render(state);
}

export function disposeSceneRenderer(renderer) {
  renderer.activeRenderer?.dispose();
  renderer.activeRenderer = null;
}

