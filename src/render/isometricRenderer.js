import { BUILDING_DEFINITIONS } from '../content/buildings.js';
import { AnimationManager } from './animations.js';
import { runIsometricFrame } from './isometricFramePipeline.js';
import { IsometricCamera } from './isometricCamera.js';
import { ParticleSystem } from './particles.js';
import { FrameQualityController } from './qualityController.js';
import { SpriteFactory } from './spriteFactory.js';
import { updateColonistRenderState } from './colonistInterpolation.js';
import { drawIsometricEntityPass } from './isometricEntityDraw.js';
import { normalizeCameraState } from './cameraState.js';
import { createDebugStats } from './debugStats.js';
import { InteractionController } from './interactionController.js';
import { handleIsometricClickSelection, updateIsometricHoverSelection } from './isometricInteractionHandlers.js';
import { buildIsometricCameraStatePayload, buildIsometricDebugStatsPayload } from './isometricRendererViewState.js';
import {
  emitAmbientBuildingEffects,
  maybeEmitResourceGainFloatingText,
  syncPlacementAnimationEffects,
} from './isometricRuntimeEffects.js';
import { ResourceGainTracker } from './resourceGainTracker.js';
import { drawBackgroundLayer, drawPlacementPreview, drawSelectionHighlight } from './overlayPainter.js';
import { TerrainLayerRenderer } from './terrainLayer.js';

export class IsometricRenderer {
  constructor(rootElement, options = {}) {
    this.rootElement = rootElement;
    this.options = {
      quality: options.quality ?? 'balanced',
      effectsEnabled: options.effectsEnabled ?? true,
      autoQuality: options.autoQuality ?? true,
      cameraTileWidth: options.cameraTileWidth ?? 64,
      cameraTileHeight: options.cameraTileHeight ?? 32,
    };
    this.onGroundClick = null;
    this.onPlacementPreview = null;
    this.onEntitySelect = null;

    this.canvas = document.createElement('canvas');
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.display = 'block';
    this.rootElement.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d', { alpha: true });

    this.camera = new IsometricCamera({
      tileWidth: this.options.cameraTileWidth,
      tileHeight: this.options.cameraTileHeight,
      zoom: 1.05,
      minZoom: 0.55,
      maxZoom: 2.8,
      worldRadius: 30,
    });
    this.animations = new AnimationManager();
    this.spriteFactory = new SpriteFactory({ quality: this.options.quality });
    this.spriteFactory.prewarm(BUILDING_DEFINITIONS);
    this.particles = new ParticleSystem({
      maxParticles: this.options.quality === 'high' ? 900 : 520,
    });
    this.qualityController = new FrameQualityController({
      enabled: this.options.autoQuality,
    });

    this.preview = null;
    this.lastFrameAt = performance.now();
    this.smoothedFps = 60;
    this.devicePixelRatio = 1;
    this.resourceGainTracker = new ResourceGainTracker({ cooldownSeconds: 1.1, minDelta: 3 });
    this.lastState = null;
    this.selectedEntity = null;
    this.hoveredEntity = null;
    this.colonistRenderState = new Map();
    this.knownBuildingIds = new Set();
    this.interactiveEntities = [];
    this.terrainLayer = new TerrainLayerRenderer(this.spriteFactory);
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
    const width = Math.max(1, this.rootElement.clientWidth);
    const height = Math.max(1, this.rootElement.clientHeight);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.devicePixelRatio = dpr;
    this.canvas.width = Math.floor(width * dpr);
    this.canvas.height = Math.floor(height * dpr);
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);
    this.camera.setViewport(width, height);
    this.terrainLayer.resize(width, height, dpr);
  }

  dispose() {
    window.removeEventListener('resize', this.boundResize);
    this.interactionController.dispose();
    this.interactionController = null;
    this.canvas.remove();
    this.interactiveEntities = [];
    this.terrainLayer = null;
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
    if (!position) {
      this.preview = null;
      return;
    }
    this.preview = {
      x: position.x,
      z: position.z,
      valid,
    };
  }

  clearPreview() {
    this.preview = null;
  }

  updatePlacementMarker(position, valid) {
    if (!position) {
      this.clearPreview();
      return;
    }
    this.setPreviewPosition(position, valid);
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
    const frame = runIsometricFrame({
      state,
      now: performance.now(),
      lastFrameAt: this.lastFrameAt,
      smoothedFps: this.smoothedFps,
      camera: this.camera,
      qualityController: this.qualityController,
      particles: this.particles,
      sampleResourceGains: (nextState, deltaSeconds) => this.sampleResourceGains(nextState, deltaSeconds),
      syncBuildingAnimations: (nextState, now) => this.syncBuildingAnimations(nextState, now),
      updateColonistInterpolation: (nextState, deltaSeconds) =>
        this.updateColonistInterpolation(nextState, deltaSeconds),
      maybeEmitBuildingEffects: (nextState, deltaSeconds) =>
        this.maybeEmitBuildingEffects(nextState, deltaSeconds),
      drawBackground: (nextState, width, height, daylight) =>
        this.drawBackground(nextState, width, height, daylight),
      drawTerrain: (nextState) => this.drawTerrain(nextState),
      drawEntities: (nextState, now, daylight) => this.drawEntities(nextState, now, daylight),
      drawPreview: () => this.drawPreview(),
      hoveredEntity: this.hoveredEntity,
      selectedEntity: this.selectedEntity,
      drawSelectionOverlay: (entity, alpha) => this.drawSelectionOverlay(entity, alpha),
      getSelectionPulse: (now) => this.animations.getSelectionPulse(now),
      ctx: this.ctx,
    });
    this.lastFrameAt = frame.nextLastFrameAt;
    this.smoothedFps = frame.nextSmoothedFps;
  }
}

