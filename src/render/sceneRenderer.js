import { IsometricRenderer } from './isometricRenderer.js';
import { LegacyThreeRenderer } from './legacyThreeRenderer.js';
import {
  applySceneRendererEntitySelectHandler,
  applySceneRendererGroundClickHandler,
  applySceneRendererPlacementPreviewHandler,
} from './sceneRendererHandlers.js';
import { defineSceneRendererCallbackProperties } from './sceneRendererProperties.js';
import {
  applySceneRendererPreviewPosition,
  clearSceneRendererPreview,
  updateSceneRendererPlacementMarker,
} from './sceneRendererPreviewHandlers.js';
import { buildSceneRendererCameraState, buildSceneRendererDebugStats } from './sceneRendererSnapshots.js';
import { dispatchSceneRendererModeChange, getSceneRendererMode } from './sceneRendererModeDispatch.js';
import {
  centerSceneRendererOnBuilding,
  disposeSceneRenderer,
  getSceneRendererAvailableModes,
  renderSceneRendererFrame,
  resizeSceneRenderer,
} from './sceneRendererRuntimeDispatch.js';
import { buildSceneRendererModeInitializationInvocation } from './sceneRendererModeInvocation.js';
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
    const result = initializeSceneRendererMode(buildSceneRendererModeInitializationInvocation({
      renderer: this,
      mode,
      createIsometricRenderer: (rootElement, options) => new IsometricRenderer(rootElement, options),
      createThreeRenderer: (rootElement) => new LegacyThreeRenderer(rootElement),
      persistRendererMode: persistRendererModePreference,
    }));
    this.activeRenderer = result.renderer;
    this.mode = result.mode;
  }

  setRendererMode(mode) {
    return dispatchSceneRendererModeChange(this, mode, {
      normalizeMode: normalizeRendererMode,
    });
  }

  getRendererMode() {
    return getSceneRendererMode(this);
  }

  getAvailableModes() {
    return getSceneRendererAvailableModes();
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
    applySceneRendererPreviewPosition(this, position, valid);
  }

  clearPreview() {
    clearSceneRendererPreview(this);
  }

  updatePlacementMarker(position, valid = true) {
    updateSceneRendererPlacementMarker(this, position, valid);
  }

  centerOnBuilding(building) {
    centerSceneRendererOnBuilding(this, building);
  }

  resize() {
    resizeSceneRenderer(this);
  }

  getCameraState() {
    return buildSceneRendererCameraState(this);
  }

  getDebugStats() {
    return buildSceneRendererDebugStats(this);
  }

  render(state) {
    renderSceneRendererFrame(this, state);
  }

  dispose() {
    disposeSceneRenderer(this);
  }
}
