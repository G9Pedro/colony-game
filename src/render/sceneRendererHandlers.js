export function applySceneRendererGroundClickHandler(renderer, handler) {
  renderer._onGroundClick = handler;
  renderer.activeRenderer?.setGroundClickHandler(handler);
}

export function applySceneRendererPlacementPreviewHandler(renderer, handler) {
  renderer._onPlacementPreview = handler;
  renderer.activeRenderer?.setPlacementPreviewHandler(handler);
}

export function applySceneRendererEntitySelectHandler(renderer, handler) {
  renderer._onEntitySelect = handler;
  renderer.activeRenderer?.setEntitySelectHandler(handler);
}

