export function applyFallbackGroundClickHandler(renderer, handler) {
  renderer.delegate.setGroundClickHandler(handler);
}

export function applyFallbackPlacementPreviewHandler(renderer, handler) {
  renderer.delegate.setPlacementPreviewHandler(handler);
}

export function applyFallbackEntitySelectHandler(renderer, handler) {
  renderer.delegate.setEntitySelectHandler(handler);
}

export function applyFallbackPreviewPosition(renderer, position, valid = true) {
  renderer.delegate.setPreviewPosition(position, valid);
}

export function clearFallbackPreview(renderer) {
  renderer.delegate.clearPreview();
}

export function updateFallbackPlacementMarker(renderer, position, valid = true) {
  renderer.delegate.updatePlacementMarker(position, valid);
}

export function centerFallbackOnBuilding(renderer, building) {
  renderer.delegate.centerOnBuilding(building);
}

export function buildFallbackCameraState(renderer) {
  return renderer.delegate.getCameraState();
}

export function buildFallbackDebugStats(renderer) {
  return renderer.delegate.getDebugStats?.() ?? null;
}

export function resizeFallbackRenderer(renderer) {
  renderer.delegate.resize();
}

export function renderFallbackFrame(renderer, state) {
  renderer.delegate.render(state);
}

export function disposeFallbackRenderer(renderer) {
  renderer.delegate.dispose();
}

