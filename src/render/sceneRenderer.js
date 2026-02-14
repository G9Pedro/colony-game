import { IsometricRenderer } from './isometricRenderer.js';
import { LegacyThreeRenderer } from './legacyThreeRenderer.js';
import { normalizeCameraState } from './cameraState.js';
import { normalizeDebugStats } from './debugStats.js';
import {
  normalizeRendererMode,
  persistRendererModePreference,
  readRendererModePreference,
} from './rendererModePreference.js';
import { instantiateSceneRenderer, syncSceneRendererSession } from './sceneRendererLifecycle.js';

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
    Object.defineProperty(this, 'onGroundClick', {
      configurable: true,
      enumerable: true,
      get: () => this._onGroundClick,
      set: (handler) => this.setGroundClickHandler(handler),
    });
    Object.defineProperty(this, 'onPlacementPreview', {
      configurable: true,
      enumerable: true,
      get: () => this._onPlacementPreview,
      set: (handler) => this.setPlacementPreviewHandler(handler),
    });
    Object.defineProperty(this, 'onEntitySelect', {
      configurable: true,
      enumerable: true,
      get: () => this._onEntitySelect,
      set: (handler) => this.setEntitySelectHandler(handler),
    });

    this.initializeRenderer(this.mode);
  }

  initializeRenderer(mode) {
    if (this.activeRenderer) {
      this.activeRenderer.dispose();
    }

    const result = instantiateSceneRenderer({
      mode,
      rootElement: this.rootElement,
      createIsometricRenderer: (rootElement, options) => new IsometricRenderer(rootElement, options),
      createThreeRenderer: (rootElement) => new LegacyThreeRenderer(rootElement),
    });
    this.activeRenderer = result.renderer;
    this.mode = result.mode;

    persistRendererModePreference(this.mode);
    syncSceneRendererSession(this.activeRenderer, {
      onGroundClick: this._onGroundClick,
      onPlacementPreview: this._onPlacementPreview,
      onEntitySelect: this._onEntitySelect,
      preview: this.preview,
      lastState: this.lastState,
    });
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
    this._onGroundClick = handler;
    this.activeRenderer?.setGroundClickHandler(handler);
  }

  setPlacementPreviewHandler(handler) {
    this._onPlacementPreview = handler;
    this.activeRenderer?.setPlacementPreviewHandler(handler);
  }

  setEntitySelectHandler(handler) {
    this._onEntitySelect = handler;
    this.activeRenderer?.setEntitySelectHandler(handler);
  }

  setPreviewPosition(position, valid = true) {
    if (!position) {
      this.clearPreview();
      return;
    }
    this.preview = { position, valid };
    this.activeRenderer?.setPreviewPosition(position, valid);
  }

  clearPreview() {
    this.preview = null;
    this.activeRenderer?.clearPreview();
  }

  updatePlacementMarker(position, valid = true) {
    if (!position) {
      this.clearPreview();
      return;
    }
    this.setPreviewPosition(position, valid);
  }

  centerOnBuilding(building) {
    this.activeRenderer?.centerOnBuilding(building);
  }

  resize() {
    this.activeRenderer?.resize();
  }

  getCameraState() {
    const rawCameraState = this.activeRenderer?.getCameraState?.();
    return normalizeCameraState(rawCameraState, {
      mode: this.mode,
      projection: this.mode === 'three' ? 'perspective' : 'isometric',
    });
  }

  getDebugStats() {
    const rawStats = this.activeRenderer?.getDebugStats?.();
    return normalizeDebugStats(rawStats, this.mode);
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
