import { createIsometricPreviewState, resolveIsometricPreviewUpdate } from './isometricPreviewState.js';

export function applyIsometricPreviewPosition(renderer, position, valid = true) {
  renderer.preview = createIsometricPreviewState(position, valid);
}

export function clearIsometricPreview(renderer) {
  renderer.preview = null;
}

export function updateIsometricPreviewMarker(renderer, position, valid) {
  renderer.preview = resolveIsometricPreviewUpdate(position, valid);
}

