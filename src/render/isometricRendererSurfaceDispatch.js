import {
  applyRendererEntitySelectHandler,
  applyRendererGroundClickHandler,
  applyRendererPlacementPreviewHandler,
} from './rendererCallbackState.js';
import {
  applyIsometricPreviewPosition,
  clearIsometricPreview,
  updateIsometricPreviewMarker,
} from './isometricPreviewHandlers.js';
import {
  buildIsometricRendererCameraState,
  buildIsometricRendererDebugStats,
} from './isometricRendererSnapshots.js';

export function dispatchIsometricGroundClickHandler(renderer, handler, deps = {}) {
  const applyGroundClickHandler = deps.applyGroundClickHandler ?? applyRendererGroundClickHandler;
  applyGroundClickHandler(renderer, handler);
}

export function dispatchIsometricPlacementPreviewHandler(renderer, handler, deps = {}) {
  const applyPlacementPreviewHandler = deps.applyPlacementPreviewHandler ?? applyRendererPlacementPreviewHandler;
  applyPlacementPreviewHandler(renderer, handler);
}

export function dispatchIsometricEntitySelectHandler(renderer, handler, deps = {}) {
  const applyEntitySelectHandler = deps.applyEntitySelectHandler ?? applyRendererEntitySelectHandler;
  applyEntitySelectHandler(renderer, handler);
}

export function dispatchIsometricPreviewSet(renderer, position, valid = true, deps = {}) {
  const applyPreview = deps.applyPreview ?? applyIsometricPreviewPosition;
  applyPreview(renderer, position, valid);
}

export function dispatchIsometricPreviewClear(renderer, deps = {}) {
  const clearPreview = deps.clearPreview ?? clearIsometricPreview;
  clearPreview(renderer);
}

export function dispatchIsometricPlacementMarker(renderer, position, valid, deps = {}) {
  const updateMarker = deps.updateMarker ?? updateIsometricPreviewMarker;
  updateMarker(renderer, position, valid);
}

export function dispatchIsometricCenterOnBuilding(renderer, building) {
  if (!building) {
    return;
  }
  renderer.camera.centerOn(building.x, building.z);
}

export function buildIsometricCameraSnapshot(renderer, deps = {}) {
  const buildCameraState = deps.buildCameraState ?? buildIsometricRendererCameraState;
  return buildCameraState(renderer);
}

export function buildIsometricDebugSnapshot(renderer, deps = {}) {
  const buildDebugStats = deps.buildDebugStats ?? buildIsometricRendererDebugStats;
  return buildDebugStats(renderer);
}

