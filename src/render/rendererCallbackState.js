export function applyRendererGroundClickHandler(renderer, handler) {
  renderer.onGroundClick = handler;
}

export function applyRendererPlacementPreviewHandler(renderer, handler) {
  renderer.onPlacementPreview = handler;
}

export function applyRendererEntitySelectHandler(renderer, handler) {
  renderer.onEntitySelect = handler;
}

