import { IsometricRenderer } from './isometricRenderer.js';
import { createFallbackRendererDelegate } from './fallbackRendererRuntime.js';

export class FallbackRenderer {
  constructor(rootElement) {
    this.delegate = createFallbackRendererDelegate({
      rootElement,
      createIsometricRenderer: (target, options) => new IsometricRenderer(target, options),
    });
  }

  setGroundClickHandler(handler) {
    this.delegate.setGroundClickHandler(handler);
  }

  setPlacementPreviewHandler(handler) {
    this.delegate.setPlacementPreviewHandler(handler);
  }

  setEntitySelectHandler(handler) {
    this.delegate.setEntitySelectHandler(handler);
  }

  setPreviewPosition(position, valid = true) {
    this.delegate.setPreviewPosition(position, valid);
  }

  clearPreview() {
    this.delegate.clearPreview();
  }

  updatePlacementMarker(position, valid = true) {
    this.delegate.updatePlacementMarker(position, valid);
  }

  centerOnBuilding(building) {
    this.delegate.centerOnBuilding(building);
  }

  getCameraState() {
    return this.delegate.getCameraState();
  }

  getDebugStats() {
    return this.delegate.getDebugStats?.() ?? null;
  }

  resize() {
    this.delegate.resize();
  }

  render(state) {
    this.delegate.render(state);
  }

  dispose() {
    this.delegate.dispose();
  }
}
