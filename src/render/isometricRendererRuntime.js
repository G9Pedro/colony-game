import { BUILDING_DEFINITIONS } from '../content/buildings.js';
import { AnimationManager } from './animations.js';
import { IsometricCamera } from './isometricCamera.js';
import { ParticleSystem } from './particles.js';
import { FrameQualityController } from './qualityController.js';
import { SpriteFactory } from './spriteFactory.js';
import { ResourceGainTracker } from './resourceGainTracker.js';
import { TerrainLayerRenderer } from './terrainLayer.js';

export function normalizeIsometricRendererOptions(options = {}) {
  return {
    quality: options.quality ?? 'balanced',
    effectsEnabled: options.effectsEnabled ?? true,
    autoQuality: options.autoQuality ?? true,
    cameraTileWidth: options.cameraTileWidth ?? 64,
    cameraTileHeight: options.cameraTileHeight ?? 32,
  };
}

export function createIsometricRendererRuntime({
  rootElement,
  options = {},
  documentObject = document,
  performanceObject = performance,
  buildingDefinitions = BUILDING_DEFINITIONS,
  dependencies = {},
}) {
  const {
    IsometricCameraClass = IsometricCamera,
    AnimationManagerClass = AnimationManager,
    SpriteFactoryClass = SpriteFactory,
    ParticleSystemClass = ParticleSystem,
    FrameQualityControllerClass = FrameQualityController,
    ResourceGainTrackerClass = ResourceGainTracker,
    TerrainLayerRendererClass = TerrainLayerRenderer,
  } = dependencies;
  const normalizedOptions = normalizeIsometricRendererOptions(options);

  const canvas = documentObject.createElement('canvas');
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.display = 'block';
  rootElement.appendChild(canvas);
  const ctx = canvas.getContext('2d', { alpha: true });

  const camera = new IsometricCameraClass({
    tileWidth: normalizedOptions.cameraTileWidth,
    tileHeight: normalizedOptions.cameraTileHeight,
    zoom: 1.05,
    minZoom: 0.55,
    maxZoom: 2.8,
    worldRadius: 30,
  });

  const animations = new AnimationManagerClass();
  const spriteFactory = new SpriteFactoryClass({ quality: normalizedOptions.quality });
  spriteFactory.prewarm(buildingDefinitions);
  const particles = new ParticleSystemClass({
    maxParticles: normalizedOptions.quality === 'high' ? 900 : 520,
  });
  const qualityController = new FrameQualityControllerClass({
    enabled: normalizedOptions.autoQuality,
  });
  const resourceGainTracker = new ResourceGainTrackerClass({ cooldownSeconds: 1.1, minDelta: 3 });
  const terrainLayer = new TerrainLayerRendererClass(spriteFactory);

  return {
    options: normalizedOptions,
    canvas,
    ctx,
    camera,
    animations,
    spriteFactory,
    particles,
    qualityController,
    preview: null,
    lastFrameAt: performanceObject.now(),
    smoothedFps: 60,
    devicePixelRatio: 1,
    resourceGainTracker,
    lastState: null,
    selectedEntity: null,
    hoveredEntity: null,
    colonistRenderState: new Map(),
    knownBuildingIds: new Set(),
    interactiveEntities: [],
    terrainLayer,
  };
}

