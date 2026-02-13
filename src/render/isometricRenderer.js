import { BUILDING_DEFINITIONS } from '../content/buildings.js';
import { AnimationManager } from './animations.js';
import { IsometricCamera } from './isometricCamera.js';
import { ParticleSystem } from './particles.js';
import { FrameQualityController } from './qualityController.js';
import { SpriteFactory } from './spriteFactory.js';
import { buildEntityRenderPass } from './entityRenderPass.js';
import { createDebugStats } from './debugStats.js';
import { InteractionController } from './interactionController.js';
import { drawBackgroundLayer, drawPlacementPreview, drawSelectionHighlight, drawTimeAndSeasonOverlays } from './overlayPainter.js';
import { TerrainLayerRenderer } from './terrainLayer.js';

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

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
    this.previousResources = null;
    this.resourceSampleCooldown = 0;
    this.lastState = null;
    this.selectedEntity = null;
    this.hoveredEntity = null;
    this.colonistRenderState = new Map();
    this.knownBuildingIds = new Set();
    this.knownConstructionIds = new Set();
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
    return this.camera.getState();
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

    if (!selectedBuildingType && hit?.entity) {
      this.setSelectedEntity(hit.entity);
      return;
    }

    if (!selectedBuildingType) {
      this.setSelectedEntity(null);
    }

    if (this.onGroundClick) {
      this.onGroundClick({ x: tile.x, z: tile.z });
    }
  }

  hitTestEntity(localX, localY) {
    let best = null;
    for (const item of this.interactiveEntities) {
      const dx = localX - item.centerX;
      const dy = localY - item.centerY;
      if (Math.abs(dx) > item.halfWidth || Math.abs(dy) > item.halfHeight) {
        continue;
      }
      const distance = Math.hypot(dx, dy);
      if (!best || item.depth > best.depth || (item.depth === best.depth && distance < best.distance)) {
        best = {
          entity: item.entity,
          depth: item.depth,
          distance,
        };
      }
    }
    return best;
  }

  syncBuildingAnimations(state, now) {
    const nextIds = new Set(state.buildings.map((building) => building.id));
    state.buildings.forEach((building) => {
      if (!this.knownBuildingIds.has(building.id)) {
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
      }
    });
    this.knownBuildingIds = nextIds;

    this.knownConstructionIds = new Set(state.constructionQueue.map((item) => item.id));
  }

  updateColonistInterpolation(state, deltaSeconds) {
    const aliveIds = new Set();
    for (const colonist of state.colonists) {
      if (!colonist.alive) {
        continue;
      }
      aliveIds.add(colonist.id);
      let renderState = this.colonistRenderState.get(colonist.id);
      if (!renderState) {
        renderState = {
          x: colonist.position.x,
          z: colonist.position.z,
        };
        this.colonistRenderState.set(colonist.id, renderState);
      }
      const interpolation = clamp(deltaSeconds * 8, 0.12, 1);
      renderState.x += (colonist.position.x - renderState.x) * interpolation;
      renderState.z += (colonist.position.z - renderState.z) * interpolation;
    }

    for (const [id] of this.colonistRenderState.entries()) {
      if (!aliveIds.has(id)) {
        this.colonistRenderState.delete(id);
      }
    }
  }

  sampleResourceGains(state, deltaSeconds) {
    this.resourceSampleCooldown -= deltaSeconds;
    if (this.resourceSampleCooldown > 0) {
      return;
    }
    this.resourceSampleCooldown = 1.1;

    if (!this.previousResources) {
      this.previousResources = { ...state.resources };
      return;
    }

    const gains = Object.entries(state.resources)
      .map(([key, amount]) => [key, amount - (this.previousResources[key] ?? amount)])
      .filter(([, delta]) => delta >= 3);

    if (gains.length > 0 && this.options.effectsEnabled && this.qualityController.shouldRunOptionalEffects()) {
      const [resource, delta] = gains[0];
      const origin = state.buildings[Math.floor(Math.random() * Math.max(1, state.buildings.length))];
      this.particles.emitFloatingText({
        x: origin?.x ?? this.camera.centerX,
        z: origin?.z ?? this.camera.centerZ,
        text: `+${Math.floor(delta)} ${resource}`,
        color: '#f4ead0',
      });
    }
    this.previousResources = { ...state.resources };
  }

  getDaylightFactor(state) {
    const dayCycle = (state.timeSeconds % 24) / 24;
    return clamp(0.5 + Math.sin(dayCycle * Math.PI * 2 - Math.PI * 0.5) * 0.5, 0, 1);
  }

  getSeasonTint(state) {
    const cycle = (state.day % 120) / 120;
    if (cycle < 0.25) {
      return 'rgba(82, 156, 94, 0.08)';
    }
    if (cycle > 0.6 && cycle < 0.85) {
      return 'rgba(178, 134, 66, 0.1)';
    }
    return 'rgba(0, 0, 0, 0)';
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
    const smokeRate = deltaSeconds * 0.75 * qualityMultiplier;
    state.buildings.forEach((building) => {
      if ((building.type === 'workshop' || building.type === 'ironMine') && Math.random() < smokeRate) {
        this.particles.emitBurst({
          x: building.x + 0.3,
          z: building.z - 0.2,
          kind: 'smoke',
          count: Math.max(1, Math.round(2 * qualityMultiplier)),
          color: 'rgba(185, 188, 196, 0.45)',
        });
      }
      if ((building.type === 'shrine' || building.type === 'library') && Math.random() < smokeRate * 0.5) {
        this.particles.emitBurst({
          x: building.x,
          z: building.z,
          kind: 'sparkle',
          count: 1,
          color: 'rgba(253, 235, 177, 0.65)',
        });
      }
    });
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
    const now = performance.now();
    const deltaSeconds = Math.min(0.12, (now - this.lastFrameAt) / 1000);
    this.lastFrameAt = now;
    if (deltaSeconds > 0) {
      const instantFps = 1 / deltaSeconds;
      this.smoothedFps = this.smoothedFps * 0.9 + instantFps * 0.1;
    }
    this.qualityController.recordFrame(deltaSeconds);
    this.camera.setWorldRadius(state.maxWorldRadius);
    this.camera.update(deltaSeconds);
    this.particles.setQuality(this.qualityController.getParticleMultiplier());
    this.particles.update(deltaSeconds);
    this.sampleResourceGains(state, deltaSeconds);
    this.syncBuildingAnimations(state, now);
    this.updateColonistInterpolation(state, deltaSeconds);
    this.maybeEmitBuildingEffects(state, deltaSeconds);

    const width = this.camera.viewportWidth;
    const height = this.camera.viewportHeight;
    const daylight = this.getDaylightFactor(state);
    this.drawBackground(state, width, height, daylight);
    this.drawTerrain(state);
    this.drawEntities(state, now, daylight);
    this.drawPreview();

    if (this.hoveredEntity) {
      this.drawSelectionOverlay(this.hoveredEntity, this.animations.getSelectionPulse(now) * 0.75);
    }
    if (this.selectedEntity) {
      this.drawSelectionOverlay(this.selectedEntity, this.animations.getSelectionPulse(now));
    }

    drawTimeAndSeasonOverlays(
      this.ctx,
      width,
      height,
      1 - daylight,
      this.getSeasonTint(state),
    );
  }
}

