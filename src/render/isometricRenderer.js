import { dispatchIsometricFrame } from './isometricFrameDispatch.js';
import { dispatchIsometricDispose, dispatchIsometricResize } from './isometricLifecycleDispatch.js';
import {
  dispatchIsometricClickSelection,
  dispatchIsometricEntitySelection,
  dispatchIsometricHoverSelection,
} from './isometricSelectionDispatch.js';
import {
  dispatchIsometricAmbientEffects,
  dispatchIsometricColonistInterpolation,
  dispatchIsometricPlacementAnimationSync,
  dispatchIsometricResourceGainSampling,
} from './isometricRuntimeDispatch.js';
import {
  dispatchIsometricBackgroundDraw,
  dispatchIsometricEntityDraw,
  dispatchIsometricPreviewDraw,
  dispatchIsometricSelectionDraw,
  dispatchIsometricTerrainDraw,
} from './isometricDrawDispatch.js';
import { initializeIsometricRenderer } from './isometricRendererInitialization.js';
import {
  buildIsometricCameraSnapshot,
  buildIsometricDebugSnapshot,
  dispatchIsometricCenterOnBuilding,
  dispatchIsometricEntitySelectHandler,
  dispatchIsometricGroundClickHandler,
  dispatchIsometricPlacementMarker,
  dispatchIsometricPlacementPreviewHandler,
  dispatchIsometricPreviewClear,
  dispatchIsometricPreviewSet,
} from './isometricRendererSurfaceDispatch.js';

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
    dispatchIsometricGroundClickHandler(this, handler);
  }

  setPlacementPreviewHandler(handler) {
    dispatchIsometricPlacementPreviewHandler(this, handler);
  }

  setEntitySelectHandler(handler) {
    dispatchIsometricEntitySelectHandler(this, handler);
  }

  setPreviewPosition(position, valid = true) {
    dispatchIsometricPreviewSet(this, position, valid);
  }

  clearPreview() {
    dispatchIsometricPreviewClear(this);
  }

  updatePlacementMarker(position, valid) {
    dispatchIsometricPlacementMarker(this, position, valid);
  }

  centerOnBuilding(building) {
    dispatchIsometricCenterOnBuilding(this, building);
  }

  getCameraState() {
    return buildIsometricCameraSnapshot(this);
  }

  getDebugStats() {
    return buildIsometricDebugSnapshot(this);
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
    dispatchIsometricPlacementAnimationSync(this, state, now);
  }

  updateColonistInterpolation(state, deltaSeconds) {
    dispatchIsometricColonistInterpolation(this, state, deltaSeconds);
  }

  sampleResourceGains(state, deltaSeconds) {
    dispatchIsometricResourceGainSampling(this, state, deltaSeconds);
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
    dispatchIsometricAmbientEffects(this, state, deltaSeconds);
  }

  drawEntities(state, now, daylight) {
    return dispatchIsometricEntityDraw(this, state, now, daylight);
  }

  render(state) {
    dispatchIsometricFrame(this, state);
  }
}

