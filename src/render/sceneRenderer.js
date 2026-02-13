import { IsometricRenderer } from './isometricRenderer.js';
import { LegacyThreeRenderer } from './legacyThreeRenderer.js';

const RENDERER_MODE_STORAGE_KEY = 'colony-frontier-renderer-mode';

function normalizeMode(mode) {
  return mode === 'three' ? 'three' : 'isometric';
}

function readRendererModePreference() {
  try {
    return window.localStorage.getItem(RENDERER_MODE_STORAGE_KEY);
  } catch (error) {
    return null;
  }
}

function persistRendererModePreference(mode) {
  try {
    window.localStorage.setItem(RENDERER_MODE_STORAGE_KEY, mode);
  } catch (error) {
    // no-op when storage is unavailable
  }
}

export class SceneRenderer {
  constructor(rootElement) {
    this.rootElement = rootElement;
    this._onGroundClick = null;
    this._onPlacementPreview = null;
    this._onEntitySelect = null;
    this.preview = null;
    this.mode = normalizeMode(readRendererModePreference() ?? 'isometric');
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

    const normalizedMode = normalizeMode(mode);
    try {
      this.activeRenderer = normalizedMode === 'three'
        ? new LegacyThreeRenderer(this.rootElement)
        : new IsometricRenderer(this.rootElement);
      this.mode = normalizedMode;
    } catch (error) {
      this.activeRenderer = new IsometricRenderer(this.rootElement, {
        quality: 'low',
        effectsEnabled: false,
      });
      this.mode = 'isometric';
    }

    persistRendererModePreference(this.mode);
    this.activeRenderer.setGroundClickHandler(this._onGroundClick);
    this.activeRenderer.setPlacementPreviewHandler(this._onPlacementPreview);
    this.activeRenderer.setEntitySelectHandler(this._onEntitySelect);
    if (this.preview) {
      this.activeRenderer.updatePlacementMarker(this.preview.position, this.preview.valid);
    } else {
      this.activeRenderer.updatePlacementMarker(null, true);
    }
    if (this.lastState) {
      this.activeRenderer.render(this.lastState);
    }
  }

  setRendererMode(mode) {
    const normalizedMode = normalizeMode(mode);
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
    return this.activeRenderer?.getCameraState?.() ?? null;
  }

  getDebugStats() {
    return this.activeRenderer?.getDebugStats?.() ?? null;
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
