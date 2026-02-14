import { buildIsometricFrameInvocation } from './isometricFrameInvocation.js';
import { runIsometricFrame } from './isometricFramePipeline.js';
import { createIsometricRendererRuntime } from './isometricRendererRuntime.js';
import { disposeIsometricRenderer, resizeIsometricViewport } from './isometricRendererLifecycle.js';
import { updateColonistRenderState } from './colonistInterpolation.js';
import { drawIsometricEntityPass } from './isometricEntityDraw.js';
import { normalizeCameraState } from './cameraState.js';
import { createDebugStats } from './debugStats.js';
import { InteractionController } from './interactionController.js';
import { handleIsometricClickSelection, updateIsometricHoverSelection } from './isometricInteractionHandlers.js';
import { createIsometricPreviewState, resolveIsometricPreviewUpdate } from './isometricPreviewState.js';
import { buildIsometricCameraStatePayload, buildIsometricDebugStatsPayload } from './isometricRendererViewState.js';
import {
  emitAmbientBuildingEffects,
  maybeEmitResourceGainFloatingText,
  syncPlacementAnimationEffects,
} from './isometricRuntimeEffects.js';
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
    this.interactionController = new InteractionController({
      canvas: this.canvas,
      camera: this.camera,
      onPreview: (point) => {
        if (this.onPlacementPreview) {
          this.onPlacementPreview({ x: point.tile.x, z: point.tile.z });
        }
      },
      onHover: (point) => {
        this.updateHoverSelection(point.local.x, point.local.y);
      },
      onClick: (point) => {
        this.handleClick(point.local.x, point.local.y, point.tile);
      },
    });

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
    this.onGroundClick = handler;
  }

  setPlacementPreviewHandler(handler) {
    this.onPlacementPreview = handler;
  }

  setEntitySelectHandler(handler) {
    this.onEntitySelect = handler;
  }

  setPreviewPosition(position, valid = true) {
    this.preview = createIsometricPreviewState(position, valid);
  }

  clearPreview() {
    this.preview = null;
  }

  updatePlacementMarker(position, valid) {
    this.preview = resolveIsometricPreviewUpdate(position, valid);
  }

  centerOnBuilding(building) {
    if (!building) {
      return;
    }
    this.camera.centerOn(building.x, building.z);
  }

  getCameraState() {
    return normalizeCameraState(buildIsometricCameraStatePayload(this.camera.getState()));
  }

  getDebugStats() {
    return createDebugStats(buildIsometricDebugStatsPayload({
      smoothedFps: this.smoothedFps,
      quality: this.qualityController.getQuality(),
      particleCount: this.particles.particles.length,
      particleCap: this.particles.maxParticles,
    }));
  }

  updateHoverSelection(localX, localY) {
    updateIsometricHoverSelection({
      interactiveEntities: this.interactiveEntities,
      localX,
      localY,
      setHoveredEntity: (entity) => {
        this.hoveredEntity = entity;
      },
    });
  }

  setSelectedEntity(entity) {
    this.selectedEntity = entity ?? null;
    if (this.onEntitySelect) {
      this.onEntitySelect(this.selectedEntity);
    }
  }

  handleClick(localX, localY, tile) {
    handleIsometricClickSelection({
      interactiveEntities: this.interactiveEntities,
      localX,
      localY,
      tile,
      selectedBuildingType: this.lastState?.selectedBuildingType,
      setSelectedEntity: (entity) => this.setSelectedEntity(entity),
      onGroundClick: this.onGroundClick,
    });
  }

  syncBuildingAnimations(state, now) {
    this.knownBuildingIds = syncPlacementAnimationEffects({
      buildings: state.buildings,
      knownBuildingIds: this.knownBuildingIds,
      now,
      animations: this.animations,
      effectsEnabled: this.options.effectsEnabled,
      particles: this.particles,
    });
  }

  updateColonistInterpolation(state, deltaSeconds) {
    updateColonistRenderState(state.colonists, this.colonistRenderState, deltaSeconds);
  }

  sampleResourceGains(state, deltaSeconds) {
    const gains = this.resourceGainTracker.sample(state.resources, deltaSeconds);
    maybeEmitResourceGainFloatingText({
      gains,
      state,
      effectsEnabled: this.options.effectsEnabled,
      shouldRunOptionalEffects: this.qualityController.shouldRunOptionalEffects(),
      particles: this.particles,
      camera: this.camera,
    });
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
    emitAmbientBuildingEffects({
      state,
      deltaSeconds,
      effectsEnabled: this.options.effectsEnabled,
      shouldRunOptionalEffects: this.qualityController.shouldRunOptionalEffects(),
      qualityMultiplier: this.qualityController.getParticleMultiplier(),
      particles: this.particles,
    });
  }

  drawEntities(state, now, daylight) {
    const result = drawIsometricEntityPass({
      state,
      now,
      daylight,
      camera: this.camera,
      spriteFactory: this.spriteFactory,
      animations: this.animations,
      particles: this.particles,
      colonistRenderState: this.colonistRenderState,
      ctx: this.ctx,
      setInteractiveEntities: (interactiveEntities) => {
        this.interactiveEntities = interactiveEntities;
      },
    });
    return result;
  }

  render(state) {
    this.lastState = state;
    const frame = runIsometricFrame(buildIsometricFrameInvocation({
      renderer: this,
      state,
      now: performance.now(),
    }));
    this.lastFrameAt = frame.nextLastFrameAt;
    this.smoothedFps = frame.nextSmoothedFps;
  }
}

