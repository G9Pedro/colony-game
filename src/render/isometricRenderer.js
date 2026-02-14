import { dispatchIsometricFrame } from './isometricFrameDispatch.js';
import { dispatchIsometricDispose, dispatchIsometricResize } from './isometricLifecycleDispatch.js';
import { updateColonistRenderState } from './colonistInterpolation.js';
import {
  dispatchIsometricClickSelection,
  dispatchIsometricEntitySelection,
  dispatchIsometricHoverSelection,
} from './isometricSelectionDispatch.js';
import {
  applyRendererEntitySelectHandler,
  applyRendererGroundClickHandler,
  applyRendererPlacementPreviewHandler,
} from './rendererCallbackState.js';
import {
  buildIsometricRendererCameraState,
  buildIsometricRendererDebugStats,
} from './isometricRendererSnapshots.js';
import {
  runIsometricAmbientEffects,
  runIsometricPlacementEffectSync,
  runIsometricResourceGainSampling,
} from './isometricEffectDispatch.js';
import {
  applyIsometricPreviewPosition,
  clearIsometricPreview,
  updateIsometricPreviewMarker,
} from './isometricPreviewHandlers.js';
import {
  dispatchIsometricBackgroundDraw,
  dispatchIsometricEntityDraw,
  dispatchIsometricPreviewDraw,
  dispatchIsometricSelectionDraw,
  dispatchIsometricTerrainDraw,
} from './isometricDrawDispatch.js';
import { initializeIsometricRenderer } from './isometricRendererInitialization.js';

export class IsometricRenderer {
  constructor(rootElement, options = {}) {
    initializeIsometricRenderer(this, {
      rootElement,
      options,
      documentObject: document,
      performanceObject: performance,
      windowObject: window,
    });
  }

  resize() {
    dispatchIsometricResize(this);
  }

  dispose() {
    dispatchIsometricDispose(this);
  }

  setGroundClickHandler(handler) {
    applyRendererGroundClickHandler(this, handler);
  }

  setPlacementPreviewHandler(handler) {
    applyRendererPlacementPreviewHandler(this, handler);
  }

  setEntitySelectHandler(handler) {
    applyRendererEntitySelectHandler(this, handler);
  }

  setPreviewPosition(position, valid = true) {
    applyIsometricPreviewPosition(this, position, valid);
  }

  clearPreview() {
    clearIsometricPreview(this);
  }

  updatePlacementMarker(position, valid) {
    updateIsometricPreviewMarker(this, position, valid);
  }

  centerOnBuilding(building) {
    if (!building) {
      return;
    }
    this.camera.centerOn(building.x, building.z);
  }

  getCameraState() {
    return buildIsometricRendererCameraState(this);
  }

  getDebugStats() {
    return buildIsometricRendererDebugStats(this);
  }

  updateHoverSelection(localX, localY) {
    dispatchIsometricHoverSelection(this, localX, localY);
  }

  setSelectedEntity(entity) {
    dispatchIsometricEntitySelection(this, entity);
  }

  handleClick(localX, localY, tile) {
    dispatchIsometricClickSelection(this, localX, localY, tile);
  }

  syncBuildingAnimations(state, now) {
    this.knownBuildingIds = runIsometricPlacementEffectSync(this, state, now);
  }

  updateColonistInterpolation(state, deltaSeconds) {
    updateColonistRenderState(state.colonists, this.colonistRenderState, deltaSeconds);
  }

  sampleResourceGains(state, deltaSeconds) {
    runIsometricResourceGainSampling(this, state, deltaSeconds);
  }

  drawBackground(state, width, height, daylight) {
    dispatchIsometricBackgroundDraw(this, width, height, daylight);
  }

  drawTerrain(state) {
    dispatchIsometricTerrainDraw(this, state);
  }

  drawPreview() {
    dispatchIsometricPreviewDraw(this);
  }

  drawSelectionOverlay(entity, pulseAlpha) {
    dispatchIsometricSelectionDraw(this, entity, pulseAlpha);
  }

  maybeEmitBuildingEffects(state, deltaSeconds) {
    runIsometricAmbientEffects(this, state, deltaSeconds);
  }

  drawEntities(state, now, daylight) {
    return dispatchIsometricEntityDraw(this, state, now, daylight);
  }

  render(state) {
    dispatchIsometricFrame(this, state);
  }
}

