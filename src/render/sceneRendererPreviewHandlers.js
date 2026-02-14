import { resolveSceneRendererPreviewUpdate } from './sceneRendererPreviewState.js';

export function applySceneRendererPreviewPosition(renderer, position, valid = true) {
  const previewUpdate = resolveSceneRendererPreviewUpdate(position, valid);
  renderer.preview = previewUpdate.preview;
  if (previewUpdate.shouldClear) {
    renderer.activeRenderer?.clearPreview();
    return;
  }
  renderer.activeRenderer?.setPreviewPosition(previewUpdate.position, previewUpdate.valid);
}

export function clearSceneRendererPreview(renderer) {
  renderer.preview = null;
  renderer.activeRenderer?.clearPreview();
}

export function updateSceneRendererPlacementMarker(renderer, position, valid = true) {
  applySceneRendererPreviewPosition(renderer, position, valid);
}

