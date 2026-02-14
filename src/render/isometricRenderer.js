import { BUILDING_DEFINITIONS } from '../content/buildings.js';
import { AnimationManager } from './animations.js';
import { computeFrameDeltaSeconds, updateSmoothedFps } from './frameTiming.js';
import { IsometricCamera } from './isometricCamera.js';
import { ParticleSystem } from './particles.js';
import { FrameQualityController } from './qualityController.js';
import { SpriteFactory } from './spriteFactory.js';
import { collectBuildingEffectBursts } from './buildingEffects.js';
import { updateColonistRenderState } from './colonistInterpolation.js';
import { diffNewBuildingPlacements } from './buildingPlacementTracker.js';
import { buildEntityRenderPass } from './entityRenderPass.js';
import { normalizeCameraState } from './cameraState.js';
import { resolveClickSelectionOutcome } from './clickSelection.js';
import { createDebugStats } from './debugStats.js';
import { buildIsometricFrameContext } from './isometricFrameContext.js';
import { runIsometricFrameDynamics } from './isometricFrameDynamics.js';
import { InteractionController } from './interactionController.js';
import { ResourceGainTracker } from './resourceGainTracker.js';
import { pickBestInteractiveEntityHit } from './interactionHitTest.js';
import { drawBackgroundLayer, drawPlacementPreview, drawSelectionHighlight, drawTimeAndSeasonOverlays } from './overlayPainter.js';
import { getDaylightFactor, getSeasonTint } from './stateVisuals.js';
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
    return normalizeCameraState(this.camera.getState(), {
      mode: 'isometric',
      projection: 'isometric',
    });
  }

  getDebugStats() {
    return createDebugStats({
      mode: 'isometric',
      fps: this.smoothedFps,
      quality: this.qualityController.getQuality(),
      particles: this.particles.particles.length,
      particleCap: this.particles.maxParticles,
    });
  }

  updateHoverSelection(localX, localY) {
    const hit = this.hitTestEntity(localX, localY);
    this.hoveredEntity = hit?.entity ?? null;
  }

  setSelectedEntity(entity) {
    this.selectedEntity = entity ?? null;
    if (this.onEntitySelect) {
      this.onEntitySelect(this.selectedEntity);
    }
  }

  handleClick(localX, localY, tile) {
    const hit = this.hitTestEntity(localX, localY);
    const selectedBuildingType = this.lastState?.selectedBuildingType;
    const outcome = resolveClickSelectionOutcome({
      selectedBuildingType,
      hitEntity: hit?.entity ?? null,
    });
    if (outcome.selectionAction === 'set') {
      this.setSelectedEntity(outcome.selectedEntity);
    } else if (outcome.selectionAction === 'clear') {
      this.setSelectedEntity(null);
    }

    if (outcome.shouldGroundClick && this.onGroundClick) {
      this.onGroundClick({ x: tile.x, z: tile.z });
    }
  }

  hitTestEntity(localX, localY) {
    return pickBestInteractiveEntityHit(this.interactiveEntities, localX, localY);
  }

  syncBuildingAnimations(state, now) {
    const { nextIds, newBuildings } = diffNewBuildingPlacements(state.buildings, this.knownBuildingIds);
    newBuildings.forEach((building) => {
      this.animations.registerPlacement(building.id, now, 320);
      if (this.options.effectsEnabled) {
        this.particles.emitBurst({
          x: building.x,
          z: building.z,
          kind: 'dust',
          count: 10,
          color: 'rgba(193, 153, 104, 0.72)',
        });
      }
    });
    this.knownBuildingIds = nextIds;
  }

  updateColonistInterpolation(state, deltaSeconds) {
    updateColonistRenderState(state.colonists, this.colonistRenderState, deltaSeconds);
  }

  sampleResourceGains(state, deltaSeconds) {
    const gains = this.resourceGainTracker.sample(state.resources, deltaSeconds);

    if (gains.length > 0 && this.options.effectsEnabled && this.qualityController.shouldRunOptionalEffects()) {
      const { resource, delta } = gains[0];
      const origin = state.buildings[Math.floor(Math.random() * Math.max(1, state.buildings.length))];
      this.particles.emitFloatingText({
        x: origin?.x ?? this.camera.centerX,
        z: origin?.z ?? this.camera.centerZ,
        text: `+${Math.floor(delta)} ${resource}`,
        color: '#f4ead0',
      });
    }
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
    if (!this.options.effectsEnabled) {
      return;
    }
    if (!this.qualityController.shouldRunOptionalEffects()) {
      return;
    }
    const qualityMultiplier = this.qualityController.getParticleMultiplier();
    const bursts = collectBuildingEffectBursts(state.buildings, {
      deltaSeconds,
      qualityMultiplier,
    });
    bursts.forEach((burst) => this.particles.emitBurst(burst));
  }

  drawEntities(state, now, daylight) {
    const pass = buildEntityRenderPass({
      state,
      now,
      daylight,
      camera: this.camera,
      spriteFactory: this.spriteFactory,
      animations: this.animations,
      particles: this.particles,
      colonistRenderState: this.colonistRenderState,
    });
    this.interactiveEntities = pass.interactiveEntities;
    pass.renderables.sort((a, b) => a.depth - b.depth);
    pass.renderables.forEach((item) => item.draw(this.ctx));
  }

  render(state) {
    this.lastState = state;
    const frame = buildIsometricFrameContext({
      now: performance.now(),
      lastFrameAt: this.lastFrameAt,
      smoothedFps: this.smoothedFps,
      state,
      camera: this.camera,
      computeFrameDeltaSeconds,
      updateSmoothedFps,
      getDaylightFactor,
      maxDeltaSeconds: 0.12,
      fpsSmoothing: 0.9,
    });
    this.lastFrameAt = frame.nextLastFrameAt;
    this.smoothedFps = frame.nextSmoothedFps;
    runIsometricFrameDynamics({
      state,
      frame,
      qualityController: this.qualityController,
      camera: this.camera,
      particles: this.particles,
      sampleResourceGains: (nextState, deltaSeconds) => this.sampleResourceGains(nextState, deltaSeconds),
      syncBuildingAnimations: (nextState, now) => this.syncBuildingAnimations(nextState, now),
      updateColonistInterpolation: (nextState, deltaSeconds) =>
        this.updateColonistInterpolation(nextState, deltaSeconds),
      maybeEmitBuildingEffects: (nextState, deltaSeconds) =>
        this.maybeEmitBuildingEffects(nextState, deltaSeconds),
    });

    this.drawBackground(state, frame.width, frame.height, frame.daylight);
    this.drawTerrain(state);
    this.drawEntities(state, frame.now, frame.daylight);
    this.drawPreview();

    if (this.hoveredEntity) {
      this.drawSelectionOverlay(this.hoveredEntity, this.animations.getSelectionPulse(frame.now) * 0.75);
    }
    if (this.selectedEntity) {
      this.drawSelectionOverlay(this.selectedEntity, this.animations.getSelectionPulse(frame.now));
    }

    drawTimeAndSeasonOverlays(
      this.ctx,
      frame.width,
      frame.height,
      1 - frame.daylight,
      getSeasonTint(state.day),
    );
  }
}

