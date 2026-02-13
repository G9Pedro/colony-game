import { BUILDING_DEFINITIONS } from '../content/buildings.js';
import { AnimationManager } from './animations.js';
import { IsometricCamera } from './isometricCamera.js';
import { ParticleSystem } from './particles.js';
import { FrameQualityController } from './qualityController.js';
import { SpriteFactory } from './spriteFactory.js';
import { buildPathTileSet, buildStructureTileSet, buildTerrainSignature, getTerrainBoundsFromCorners } from './terrainUtils.js';

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function hash2d(x, z, salt = 0) {
  const value = Math.sin((x + 3.31 + salt) * 127.1 + (z + 7.17 - salt) * 311.7) * 43758.5453123;
  return value - Math.floor(value);
}

function createRoundedRectPath(ctx, x, y, width, height, radius = 8) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
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
    this.dragState = {
      active: false,
      pointerId: null,
      lastX: 0,
      lastY: 0,
    };
    this.touchState = {
      pinching: false,
      lastX: 0,
      lastY: 0,
    };
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
    this.terrainLayerCanvas = document.createElement('canvas');
    this.terrainLayerCtx = this.terrainLayerCanvas.getContext('2d', { alpha: true });
    this.terrainLayerCache = {
      valid: false,
      centerX: 0,
      centerZ: 0,
      zoom: 0,
      minX: 0,
      maxX: 0,
      minZ: 0,
      maxZ: 0,
      buildingSignature: '',
      width: 0,
      height: 0,
      dpr: 1,
    };

    this.boundHandlers = {
      resize: () => this.resize(),
      pointerDown: (event) => this.handlePointerDown(event),
      pointerMove: (event) => this.handlePointerMove(event),
      pointerUp: (event) => this.handlePointerUp(event),
      pointerCancel: () => this.handlePointerCancel(),
      wheel: (event) => this.handleWheel(event),
      touchStart: (event) => this.handleTouchStart(event),
      touchMove: (event) => this.handleTouchMove(event),
      touchEnd: () => this.handleTouchEnd(),
    };

    window.addEventListener('resize', this.boundHandlers.resize);
    this.canvas.addEventListener('pointerdown', this.boundHandlers.pointerDown);
    this.canvas.addEventListener('pointermove', this.boundHandlers.pointerMove);
    this.canvas.addEventListener('pointerup', this.boundHandlers.pointerUp);
    this.canvas.addEventListener('pointercancel', this.boundHandlers.pointerCancel);
    this.canvas.addEventListener('pointerleave', this.boundHandlers.pointerCancel);
    this.canvas.addEventListener('wheel', this.boundHandlers.wheel, { passive: false });
    this.canvas.addEventListener('touchstart', this.boundHandlers.touchStart, { passive: false });
    this.canvas.addEventListener('touchmove', this.boundHandlers.touchMove, { passive: false });
    this.canvas.addEventListener('touchend', this.boundHandlers.touchEnd, { passive: false });

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
    this.terrainLayerCanvas.width = Math.floor(width * dpr);
    this.terrainLayerCanvas.height = Math.floor(height * dpr);
    this.terrainLayerCtx.setTransform(1, 0, 0, 1, 0, 0);
    this.terrainLayerCtx.scale(dpr, dpr);
    this.terrainLayerCache.valid = false;
  }

  dispose() {
    window.removeEventListener('resize', this.boundHandlers.resize);
    this.canvas.removeEventListener('pointerdown', this.boundHandlers.pointerDown);
    this.canvas.removeEventListener('pointermove', this.boundHandlers.pointerMove);
    this.canvas.removeEventListener('pointerup', this.boundHandlers.pointerUp);
    this.canvas.removeEventListener('pointercancel', this.boundHandlers.pointerCancel);
    this.canvas.removeEventListener('pointerleave', this.boundHandlers.pointerCancel);
    this.canvas.removeEventListener('wheel', this.boundHandlers.wheel);
    this.canvas.removeEventListener('touchstart', this.boundHandlers.touchStart);
    this.canvas.removeEventListener('touchmove', this.boundHandlers.touchMove);
    this.canvas.removeEventListener('touchend', this.boundHandlers.touchEnd);
    this.canvas.remove();
    this.interactiveEntities = [];
    this.terrainLayerCanvas = null;
    this.terrainLayerCtx = null;
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
    return {
      mode: 'isometric',
      fps: this.smoothedFps,
      quality: this.qualityController.getQuality(),
      particles: this.particles.particles.length,
      particleCap: this.particles.maxParticles,
    };
  }

  localPointFromEvent(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }

  getWorldPointFromClient(clientX, clientY) {
    const local = this.localPointFromEvent(clientX, clientY);
    return {
      local,
      world: this.camera.screenToWorld(local.x, local.y),
      tile: this.camera.screenToTile(local.x, local.y),
    };
  }

  handlePointerDown(event) {
    this.dragState.active = true;
    this.dragState.pointerId = event.pointerId;
    this.dragState.lastX = event.clientX;
    this.dragState.lastY = event.clientY;
    this.camera.startDrag(event.clientX, event.clientY);
  }

  handlePointerMove(event) {
    const point = this.getWorldPointFromClient(event.clientX, event.clientY);
    this.updateHoverSelection(point.local.x, point.local.y);
    if (this.onPlacementPreview) {
      this.onPlacementPreview({ x: point.tile.x, z: point.tile.z });
    }

    if (!this.dragState.active || this.dragState.pointerId !== event.pointerId) {
      return;
    }
    this.camera.dragTo(event.clientX, event.clientY);
    this.dragState.lastX = event.clientX;
    this.dragState.lastY = event.clientY;
  }

  handlePointerUp(event) {
    if (!this.dragState.active || this.dragState.pointerId !== event.pointerId) {
      return;
    }

    this.dragState.active = false;
    const dragResult = this.camera.endDrag();
    this.dragState.pointerId = null;
    if (!dragResult.wasClick) {
      return;
    }

    const point = this.getWorldPointFromClient(event.clientX, event.clientY);
    this.handleClick(point.local.x, point.local.y, point.tile);
  }

  handlePointerCancel() {
    this.dragState.active = false;
    this.dragState.pointerId = null;
    this.camera.endDrag();
  }

  handleWheel(event) {
    event.preventDefault();
    const local = this.localPointFromEvent(event.clientX, event.clientY);
    this.camera.zoomAt(event.deltaY * 0.0012, local.x, local.y);
  }

  handleTouchStart(event) {
    if (event.touches.length === 2) {
      this.touchState.pinching = true;
      this.camera.endDrag();
      this.camera.beginPinch(event.touches[0], event.touches[1]);
      return;
    }

    if (event.touches.length === 1) {
      const touch = event.touches[0];
      this.touchState.lastX = touch.clientX;
      this.touchState.lastY = touch.clientY;
      this.camera.startDrag(touch.clientX, touch.clientY);
    }
  }

  handleTouchMove(event) {
    event.preventDefault();
    if (event.touches.length === 2 && this.touchState.pinching) {
      this.camera.updatePinch(event.touches[0], event.touches[1]);
      return;
    }
    if (event.touches.length !== 1) {
      return;
    }
    const touch = event.touches[0];
    this.camera.dragTo(touch.clientX, touch.clientY);
    this.touchState.lastX = touch.clientX;
    this.touchState.lastY = touch.clientY;
    const point = this.getWorldPointFromClient(touch.clientX, touch.clientY);
    this.updateHoverSelection(point.local.x, point.local.y);
    if (this.onPlacementPreview) {
      this.onPlacementPreview({ x: point.tile.x, z: point.tile.z });
    }
  }

  handleTouchEnd() {
    if (this.touchState.pinching) {
      this.touchState.pinching = false;
      this.camera.endPinch();
      return;
    }
    const result = this.camera.endDrag();
    if (!result.wasClick) {
      return;
    }
    const point = this.getWorldPointFromClient(this.touchState.lastX, this.touchState.lastY);
    this.handleClick(point.local.x, point.local.y, point.tile);
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
    const skyGradient = this.ctx.createLinearGradient(0, 0, 0, height);
    skyGradient.addColorStop(0, daylight > 0.42 ? '#89c5f2' : '#2f466f');
    skyGradient.addColorStop(1, daylight > 0.42 ? '#dfd2ad' : '#4d4b5f');
    this.ctx.fillStyle = skyGradient;
    this.ctx.fillRect(0, 0, width, height);

    this.ctx.fillStyle = daylight > 0.42 ? 'rgba(84, 126, 67, 0.24)' : 'rgba(42, 56, 70, 0.33)';
    this.ctx.beginPath();
    this.ctx.moveTo(0, height * 0.38);
    this.ctx.bezierCurveTo(width * 0.2, height * 0.32, width * 0.44, height * 0.43, width * 0.62, height * 0.34);
    this.ctx.bezierCurveTo(width * 0.75, height * 0.3, width * 0.88, height * 0.39, width, height * 0.31);
    this.ctx.lineTo(width, height);
    this.ctx.lineTo(0, height);
    this.ctx.closePath();
    this.ctx.fill();
  }

  drawTerrain(state) {
    const bounds = this.getTerrainBounds();
    const shouldRefresh = this.shouldRefreshTerrainLayer(state, bounds);
    if (shouldRefresh) {
      this.rebuildTerrainLayer(state, bounds);
    }
    this.ctx.drawImage(
      this.terrainLayerCanvas,
      0,
      0,
      this.terrainLayerCanvas.width,
      this.terrainLayerCanvas.height,
      0,
      0,
      this.camera.viewportWidth,
      this.camera.viewportHeight,
    );
  }

  getTerrainBounds() {
    const corners = [
      this.camera.screenToWorld(0, 0),
      this.camera.screenToWorld(this.camera.viewportWidth, 0),
      this.camera.screenToWorld(0, this.camera.viewportHeight),
      this.camera.screenToWorld(this.camera.viewportWidth, this.camera.viewportHeight),
    ];
    return getTerrainBoundsFromCorners(corners, 3);
  }

  shouldRefreshTerrainLayer(state, bounds) {
    if (!this.terrainLayerCache.valid) {
      return true;
    }
    if (this.terrainLayerCache.width !== this.camera.viewportWidth || this.terrainLayerCache.height !== this.camera.viewportHeight) {
      return true;
    }
    if (this.terrainLayerCache.dpr !== this.devicePixelRatio) {
      return true;
    }

    const centerDelta = Math.hypot(
      this.terrainLayerCache.centerX - this.camera.centerX,
      this.terrainLayerCache.centerZ - this.camera.centerZ,
    );
    const zoomDelta = Math.abs(this.terrainLayerCache.zoom - this.camera.zoom);
    const boundsChanged = this.terrainLayerCache.minX !== bounds.minX
      || this.terrainLayerCache.maxX !== bounds.maxX
      || this.terrainLayerCache.minZ !== bounds.minZ
      || this.terrainLayerCache.maxZ !== bounds.maxZ;
    if (centerDelta > 0.45 || zoomDelta > 0.04 || boundsChanged) {
      return true;
    }
    const buildingSignature = buildTerrainSignature(state);
    return buildingSignature !== this.terrainLayerCache.buildingSignature;
  }

  rebuildTerrainLayer(state, bounds) {
    const { minX, maxX, minZ, maxZ } = bounds;
    this.terrainLayerCtx.clearRect(0, 0, this.camera.viewportWidth, this.camera.viewportHeight);

    const buildingTileSet = buildStructureTileSet(state);
    const pathTileSet = buildPathTileSet(state);

    for (let z = minZ; z <= maxZ; z += 1) {
      for (let x = minX; x <= maxX; x += 1) {
        if (Math.hypot(x, z) > state.maxWorldRadius + 3) {
          continue;
        }

        const key = `${x}:${z}`;
        const onPath = pathTileSet.has(key);
        const nearBuilding = buildingTileSet.has(key);
        const variant = Math.floor(hash2d(x, z) * 4);
        const kind = onPath ? 'path' : nearBuilding ? 'dirt' : 'grass';
        const tile = this.spriteFactory.getTerrainTile(kind, variant);
        const screen = this.camera.worldToScreen(x, z);
        this.terrainLayerCtx.drawImage(tile, screen.x - tile.width * 0.5, screen.y - tile.height * 0.5);
      }
    }

    this.terrainLayerCache = {
      valid: true,
      centerX: this.camera.centerX,
      centerZ: this.camera.centerZ,
      zoom: this.camera.zoom,
      minX,
      maxX,
      minZ,
      maxZ,
      buildingSignature: buildTerrainSignature(state),
      width: this.camera.viewportWidth,
      height: this.camera.viewportHeight,
      dpr: this.devicePixelRatio,
    };
  }

  isRectVisible(x, y, width, height, padding = 48) {
    if (x + width < -padding) {
      return false;
    }
    if (y + height < -padding) {
      return false;
    }
    if (x > this.camera.viewportWidth + padding) {
      return false;
    }
    return y <= this.camera.viewportHeight + padding;
  }

  drawPreview() {
    if (!this.preview) {
      return;
    }
    const screen = this.camera.worldToScreen(this.preview.x, this.preview.z);
    const width = this.camera.tileWidth * this.camera.zoom;
    const height = this.camera.tileHeight * this.camera.zoom;
    const color = this.preview.valid ? 'rgba(60, 173, 91, 0.78)' : 'rgba(207, 86, 71, 0.78)';

    this.ctx.save();
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(screen.x, screen.y - height * 0.5);
    this.ctx.lineTo(screen.x + width * 0.5, screen.y);
    this.ctx.lineTo(screen.x, screen.y + height * 0.5);
    this.ctx.lineTo(screen.x - width * 0.5, screen.y);
    this.ctx.closePath();
    this.ctx.stroke();
    this.ctx.restore();
  }

  drawSelectionOverlay(entity, pulseAlpha) {
    if (!entity) {
      return;
    }
    this.ctx.save();
    if (entity.type === 'building') {
      const screen = this.camera.worldToScreen(entity.x, entity.z);
      const width = this.camera.tileWidth * this.camera.zoom * 1.35;
      const height = this.camera.tileHeight * this.camera.zoom * 0.8;
      this.ctx.strokeStyle = `rgba(244, 219, 152, ${pulseAlpha})`;
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.moveTo(screen.x, screen.y - height * 0.5);
      this.ctx.lineTo(screen.x + width * 0.5, screen.y);
      this.ctx.lineTo(screen.x, screen.y + height * 0.5);
      this.ctx.lineTo(screen.x - width * 0.5, screen.y);
      this.ctx.closePath();
      this.ctx.stroke();
    } else if (entity.type === 'colonist') {
      const screen = this.camera.worldToScreen(entity.x, entity.z);
      this.ctx.strokeStyle = `rgba(245, 227, 173, ${pulseAlpha})`;
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.ellipse(screen.x, screen.y + 8 * this.camera.zoom, 9 * this.camera.zoom, 4.5 * this.camera.zoom, 0, 0, Math.PI * 2);
      this.ctx.stroke();
    }
    this.ctx.restore();
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
    this.interactiveEntities = [];
    const renderables = [];

    state.constructionQueue.forEach((item) => {
      const sprite = this.spriteFactory.getBuildingSprite(item.type, { construction: true });
      const completeSprite = this.spriteFactory.getBuildingSprite(item.type, { construction: false });
      const screen = this.camera.worldToScreen(item.x, item.z);
      const progress = clamp(item.progress / Math.max(0.1, item.buildTime), 0, 1);
      const drawX = screen.x - sprite.anchorX * this.camera.zoom;
      const drawY = screen.y - sprite.anchorY * this.camera.zoom;
      const drawW = sprite.canvas.width * this.camera.zoom;
      const drawH = sprite.canvas.height * this.camera.zoom;
      if (!this.isRectVisible(drawX, drawY, drawW, drawH)) {
        return;
      }
      renderables.push({
        depth: item.x + item.z + 0.04,
        draw: (ctx) => {
          ctx.save();
          ctx.globalAlpha = 0.95;
          ctx.drawImage(sprite.canvas, drawX, drawY, drawW, drawH);

          ctx.save();
          ctx.beginPath();
          ctx.rect(drawX, drawY + drawH * (1 - progress), drawW, drawH * progress);
          ctx.clip();
          ctx.drawImage(completeSprite.canvas, drawX, drawY, drawW, drawH);
          ctx.restore();

          const barW = 40 * this.camera.zoom;
          const barH = 5 * this.camera.zoom;
          const barX = screen.x - barW * 0.5;
          const barY = screen.y - drawH * 0.42;
          createRoundedRectPath(ctx, barX, barY, barW, barH, 3);
          ctx.fillStyle = 'rgba(38, 31, 24, 0.75)';
          ctx.fill();
          createRoundedRectPath(ctx, barX, barY, barW * progress, barH, 3);
          ctx.fillStyle = 'rgba(89, 183, 120, 0.95)';
          ctx.fill();
          ctx.restore();
        },
      });
    });

    state.buildings.forEach((building) => {
      const sprite = this.spriteFactory.getBuildingSprite(building.type);
      const screen = this.camera.worldToScreen(building.x, building.z);
      const scale = this.animations.getPlacementScale(building.id, now) * this.camera.zoom;
      const drawW = sprite.canvas.width * scale;
      const drawH = sprite.canvas.height * scale;
      const drawX = screen.x - sprite.anchorX * scale;
      const drawY = screen.y - sprite.anchorY * scale;
      if (!this.isRectVisible(drawX, drawY, drawW, drawH)) {
        return;
      }
      const isNight = 1 - daylight;
      renderables.push({
        depth: building.x + building.z + 0.15,
        draw: (ctx) => {
          ctx.drawImage(sprite.canvas, drawX, drawY, drawW, drawH);
          if (isNight > 0.45 && ['house', 'apartment', 'library', 'school', 'hut'].includes(building.type)) {
            ctx.save();
            ctx.globalAlpha = isNight * 0.35;
            ctx.fillStyle = 'rgba(255, 195, 116, 0.65)';
            createRoundedRectPath(
              ctx,
              drawX + drawW * 0.42,
              drawY + drawH * 0.44,
              drawW * 0.17,
              drawH * 0.14,
              4,
            );
            ctx.fill();
            ctx.restore();
          }
        },
      });

      this.interactiveEntities.push({
        entity: {
          type: 'building',
          id: building.id,
          buildingType: building.type,
          x: building.x,
          z: building.z,
        },
        centerX: screen.x,
        centerY: screen.y - drawH * 0.15,
        halfWidth: Math.max(14, drawW * 0.2),
        halfHeight: Math.max(12, drawH * 0.2),
        depth: building.x + building.z + 0.15,
      });
    });

    state.colonists.forEach((colonist) => {
      if (!colonist.alive) {
        return;
      }
      const renderState = this.colonistRenderState.get(colonist.id);
      if (!renderState) {
        return;
      }
      const frame = Math.floor((state.timeSeconds * 6 + colonist.age) % 3);
      const idle = colonist.task !== 'Working';
      const sprite = this.spriteFactory.getColonistSprite(colonist.job, frame, { idle });
      const bob = idle ? Math.sin((state.timeSeconds + colonist.age) * 2.5) * 1.5 : Math.sin((state.timeSeconds + colonist.age) * 11) * 1.4;
      const screen = this.camera.worldToScreen(renderState.x, renderState.z);
      const drawW = sprite.width * this.camera.zoom;
      const drawH = sprite.height * this.camera.zoom;
      const drawX = screen.x - drawW * 0.5;
      const drawY = screen.y - drawH * 0.8 - bob * this.camera.zoom;
      if (!this.isRectVisible(drawX, drawY, drawW, drawH, 36)) {
        return;
      }
      renderables.push({
        depth: renderState.x + renderState.z + 0.28,
        draw: (ctx) => {
          ctx.drawImage(sprite, drawX, drawY, drawW, drawH);
        },
      });

      this.interactiveEntities.push({
        entity: {
          type: 'colonist',
          id: colonist.id,
          colonistId: colonist.id,
          x: renderState.x,
          z: renderState.z,
        },
        centerX: screen.x,
        centerY: screen.y - drawH * 0.2,
        halfWidth: Math.max(8, drawW * 0.35),
        halfHeight: Math.max(10, drawH * 0.5),
        depth: renderState.x + renderState.z + 0.28,
      });
    });

    const particleRenderables = this.particles.buildRenderables(this.camera);
    renderables.push(...particleRenderables);

    renderables.sort((a, b) => a.depth - b.depth);
    renderables.forEach((item) => item.draw(this.ctx));
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

    const nightFactor = 1 - daylight;
    if (nightFactor > 0.05) {
      this.ctx.fillStyle = `rgba(19, 28, 59, ${nightFactor * 0.35})`;
      this.ctx.fillRect(0, 0, width, height);
    }
    this.ctx.fillStyle = this.getSeasonTint(state);
    this.ctx.fillRect(0, 0, width, height);
  }
}

