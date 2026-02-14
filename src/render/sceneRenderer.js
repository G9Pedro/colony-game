import { IsometricRenderer } from './isometricRenderer.js';
import { LegacyThreeRenderer } from './legacyThreeRenderer.js';
import {
  applySceneRendererEntitySelectHandler,
  applySceneRendererGroundClickHandler,
  applySceneRendererPlacementPreviewHandler,
} from './sceneRendererHandlers.js';
import { defineSceneRendererCallbackProperties } from './sceneRendererProperties.js';
import { resolveSceneRendererPreviewUpdate } from './sceneRendererPreviewState.js';
import { buildSceneRendererCameraState, buildSceneRendererDebugStats } from './sceneRendererSnapshots.js';
import {
  normalizeRendererMode,
  persistRendererModePreference,
  readRendererModePreference,
} from './rendererModePreference.js';
import { initializeSceneRendererMode } from './sceneRendererLifecycle.js';

export class SceneRenderer {
  constructor(rootElement) {
    this.rootElement = rootElement;
    this._onGroundClick = null;
    this._onPlacementPreview = null;
    this._onEntitySelect = null;
    this.preview = null;
    this.mode = normalizeRendererMode(readRendererModePreference() ?? 'isometric');
    this.activeRenderer = null;
    this.lastState = null;
    defineSceneRendererCallbackProperties(this);

    this.initializeRenderer(this.mode);
  }

  initializeRenderer(mode) {
    const result = initializeSceneRendererMode({
      activeRenderer: this.activeRenderer,
      mode,
      rootElement: this.rootElement,
      createIsometricRenderer: (rootElement, options) => new IsometricRenderer(rootElement, options),
      createThreeRenderer: (rootElement) => new LegacyThreeRenderer(rootElement),
      persistRendererMode: persistRendererModePreference,
      sessionPayload: {
        onGroundClick: this._onGroundClick,
        onPlacementPreview: this._onPlacementPreview,
        onEntitySelect: this._onEntitySelect,
        preview: this.preview,
        lastState: this.lastState,
      },
    });
    this.activeRenderer = result.renderer;
    this.mode = result.mode;
  }

  setRendererMode(mode) {
    const normalizedMode = normalizeRendererMode(mode);
    if (normalizedMode === this.mode) {
      return true;
    }
    this.initializeRenderer(normalizedMode);
    return this.mode === normalizedMode;
  }

  getRendererMode() {
    return this.mode;
  }

  getAvailableModes() {
    return ['isometric', 'three'];
  }

  setGroundClickHandler(handler) {
    applySceneRendererGroundClickHandler(this, handler);
  }

  setPlacementPreviewHandler(handler) {
    applySceneRendererPlacementPreviewHandler(this, handler);
  }

  setEntitySelectHandler(handler) {
    applySceneRendererEntitySelectHandler(this, handler);
  }

  setPreviewPosition(position, valid = true) {
    const previewUpdate = resolveSceneRendererPreviewUpdate(position, valid);
    this.preview = previewUpdate.preview;
    if (previewUpdate.shouldClear) {
      this.activeRenderer?.clearPreview();
      return;
    }
    this.activeRenderer?.setPreviewPosition(previewUpdate.position, previewUpdate.valid);
  }

  clearPreview() {
    this.preview = null;
    this.activeRenderer?.clearPreview();
  }

  updatePlacementMarker(position, valid = true) {
    this.setPreviewPosition(position, valid);
  }

  centerOnBuilding(building) {
    this.activeRenderer?.centerOnBuilding(building);
  }

  resize() {
    this.activeRenderer?.resize();
  }

  getCameraState() {
    return buildSceneRendererCameraState(this);
  }

  getDebugStats() {
    return buildSceneRendererDebugStats(this);
  }

  render(state) {
    this.lastState = state;
    this.activeRenderer.render(state);
  }

  dispose() {
    this.activeRenderer?.dispose();
    this.activeRenderer = null;
  }
}
