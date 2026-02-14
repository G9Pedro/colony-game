import { IsometricRenderer } from './isometricRenderer.js';
import {
  applyFallbackEntitySelectHandler,
  applyFallbackGroundClickHandler,
  applyFallbackPlacementPreviewHandler,
  applyFallbackPreviewPosition,
  buildFallbackCameraState,
  buildFallbackDebugStats,
  centerFallbackOnBuilding,
  clearFallbackPreview,
  disposeFallbackRenderer,
  renderFallbackFrame,
  resizeFallbackRenderer,
  updateFallbackPlacementMarker,
} from './fallbackRendererDispatch.js';
import { createFallbackRendererDelegate } from './fallbackRendererRuntime.js';

export class FallbackRenderer {
  constructor(rootElement) {
    this.delegate = createFallbackRendererDelegate({
      rootElement,
      createIsometricRenderer: (target, options) => new IsometricRenderer(target, options),
    });
  }

  setGroundClickHandler(handler) {
    applyFallbackGroundClickHandler(this, handler);
  }

  setPlacementPreviewHandler(handler) {
    applyFallbackPlacementPreviewHandler(this, handler);
  }

  setEntitySelectHandler(handler) {
    applyFallbackEntitySelectHandler(this, handler);
  }

  setPreviewPosition(position, valid = true) {
    applyFallbackPreviewPosition(this, position, valid);
  }

  clearPreview() {
    clearFallbackPreview(this);
  }

  updatePlacementMarker(position, valid = true) {
    updateFallbackPlacementMarker(this, position, valid);
  }

  centerOnBuilding(building) {
    centerFallbackOnBuilding(this, building);
  }

  getCameraState() {
    return buildFallbackCameraState(this);
  }

  getDebugStats() {
    return buildFallbackDebugStats(this);
  }

  resize() {
    resizeFallbackRenderer(this);
  }

  render(state) {
    renderFallbackFrame(this, state);
  }

  dispose() {
    disposeFallbackRenderer(this);
  }
}
