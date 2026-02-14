import { applyLegacyPreviewMarker } from './legacyRendererViewState.js';

export function setLegacyPreviewPosition(renderer, position, valid = true) {
  applyLegacyPreviewMarker(renderer.previewMarker, position, valid);
}

export function clearLegacyPreviewPosition(renderer) {
  setLegacyPreviewPosition(renderer, null);
}

export function updateLegacyPlacementPreview(renderer, position, valid) {
  setLegacyPreviewPosition(renderer, position, valid);
}

