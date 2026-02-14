import { buildIsometricFrameInvocation } from './isometricFrameInvocation.js';
import { runIsometricFrame } from './isometricFramePipeline.js';
import { createIsometricRendererRuntime } from './isometricRendererRuntime.js';
import { disposeIsometricRenderer, resizeIsometricViewport } from './isometricRendererLifecycle.js';
import { updateColonistRenderState } from './colonistInterpolation.js';
import { drawIsometricEntityPass } from './isometricEntityDraw.js';
import { buildIsometricEntityDrawInvocation } from './isometricEntityDrawInvocation.js';
import { createIsometricInteractionSession } from './isometricInteractionSession.js';
import { handleIsometricClickSelection, updateIsometricHoverSelection } from './isometricInteractionHandlers.js';
import { applyRendererFrameState } from './rendererFrameState.js';
import {
  applyIsometricSelectedEntity,
  buildIsometricClickSelectionInvocation,
  buildIsometricHoverSelectionInvocation,
} from './isometricSelectionState.js';
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
import { drawBackgroundLayer, drawPlacementPreview, drawSelectionHighlight } from './overlayPainter.js';

export class IsometricRenderer {
  constructor(rootElement, options = {}) {
    this.rootElement = rootElement;
    this.onGroundClick = null;
    this.onPlacementPreview = null;
    this.onEntitySelect = null;
    Object.assign(this, createIsometricRendererRuntime({
      rootElement,
      options,
      documentObject: document,
      performanceObject: performance,
    }));
    this.interactionController = createIsometricInteractionSession({ renderer: this });

    this.boundResize = () => this.resize();
    window.addEventListener('resize', this.boundResize);

    this.resize();
  }

  resize() {
    const viewport = resizeIsometricViewport({
      rootElement: this.rootElement,
      canvas: this.canvas,
      ctx: this.ctx,
      camera: this.camera,
      terrainLayer: this.terrainLayer,
      windowObject: window,
      maxPixelRatio: 2,
    });
    this.devicePixelRatio = viewport.dpr;
  }

  dispose() {
    disposeIsometricRenderer({
      windowObject: window,
      boundResize: this.boundResize,
      interactionController: this.interactionController,
      canvas: this.canvas,
      clearInteractiveEntities: () => {
        this.interactiveEntities = [];
      },
      clearTerrainLayer: () => {
        this.terrainLayer = null;
      },
    });
    this.interactionController = null;
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
    updateIsometricHoverSelection(buildIsometricHoverSelectionInvocation(this, localX, localY));
  }

  setSelectedEntity(entity) {
    applyIsometricSelectedEntity(this, entity);
  }

  handleClick(localX, localY, tile) {
    handleIsometricClickSelection(buildIsometricClickSelectionInvocation(this, localX, localY, tile));
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
    drawBackgroundLayer(this.ctx, width, height, daylight);
  }

  drawTerrain(state) {
    this.terrainLayer.draw(this.ctx, state, this.camera, this.devicePixelRatio);
  }

  drawPreview() {
    drawPlacementPreview(this.ctx, this.camera, this.preview);
  }

  drawSelectionOverlay(entity, pulseAlpha) {
    drawSelectionHighlight(this.ctx, this.camera, entity, pulseAlpha);
  }

  maybeEmitBuildingEffects(state, deltaSeconds) {
    runIsometricAmbientEffects(this, state, deltaSeconds);
  }

  drawEntities(state, now, daylight) {
    const result = drawIsometricEntityPass(
      buildIsometricEntityDrawInvocation(this, state, now, daylight),
    );
    return result;
  }

  render(state) {
    this.lastState = state;
    const frame = runIsometricFrame(buildIsometricFrameInvocation({
      renderer: this,
      state,
      now: performance.now(),
    }));
    applyRendererFrameState(this, frame);
  }
}

