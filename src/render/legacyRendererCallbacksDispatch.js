import {
  applyRendererEntitySelectHandler,
  applyRendererGroundClickHandler,
  applyRendererPlacementPreviewHandler,
} from './rendererCallbackState.js';

export function dispatchLegacyGroundClickHandler(renderer, handler, deps = {}) {
  const applyGroundClickHandler = deps.applyGroundClickHandler ?? applyRendererGroundClickHandler;
  applyGroundClickHandler(renderer, handler);
}

export function dispatchLegacyPlacementPreviewHandler(renderer, handler, deps = {}) {
  const applyPlacementPreviewHandler = deps.applyPlacementPreviewHandler ?? applyRendererPlacementPreviewHandler;
  applyPlacementPreviewHandler(renderer, handler);
}

export function dispatchLegacyEntitySelectHandler(renderer, handler, deps = {}) {
  const applyEntitySelectHandler = deps.applyEntitySelectHandler ?? applyRendererEntitySelectHandler;
  applyEntitySelectHandler(renderer, handler);
}

