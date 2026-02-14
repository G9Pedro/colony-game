import { dispatchLegacyCenterOnBuilding } from './legacyCameraDispatch.js';
import { dispatchLegacyEntityPick, dispatchLegacyGroundPick } from './legacyPickerDispatch.js';
import {
  clearLegacyPreviewPosition,
  setLegacyPreviewPosition,
  updateLegacyPlacementPreview,
} from './legacyPreviewHandlers.js';
import { resizeLegacyRendererViewport } from './legacyRendererViewport.js';

export function dispatchLegacyViewportResize(renderer, deps = {}) {
  const resizeViewport = deps.resizeViewport ?? resizeLegacyRendererViewport;
  resizeViewport(renderer.rootElement, renderer.camera, renderer.renderer);
}

export function dispatchLegacyGroundPickAtScreen(renderer, clientX, clientY, deps = {}) {
  const pickGround = deps.pickGround ?? dispatchLegacyGroundPick;
  return pickGround(renderer, clientX, clientY);
}

export function dispatchLegacyEntityPickAtScreen(renderer, clientX, clientY, deps = {}) {
  const pickEntity = deps.pickEntity ?? dispatchLegacyEntityPick;
  return pickEntity(renderer, clientX, clientY);
}

export function dispatchLegacyPreviewSet(renderer, position, valid = true, deps = {}) {
  const setPreview = deps.setPreview ?? setLegacyPreviewPosition;
  setPreview(renderer, position, valid);
}

export function dispatchLegacyPreviewClear(renderer, deps = {}) {
  const clearPreview = deps.clearPreview ?? clearLegacyPreviewPosition;
  clearPreview(renderer);
}

export function dispatchLegacyPlacementMarker(renderer, position, valid, deps = {}) {
  const updateMarker = deps.updateMarker ?? updateLegacyPlacementPreview;
  updateMarker(renderer, position, valid);
}

export function dispatchLegacyCameraCenter(renderer, building, deps = {}) {
  const centerCamera = deps.centerCamera ?? dispatchLegacyCenterOnBuilding;
  centerCamera(renderer, building);
}

