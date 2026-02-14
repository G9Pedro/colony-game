import test from 'node:test';
import assert from 'node:assert/strict';
import { createIsometricRendererRuntime, normalizeIsometricRendererOptions } from '../src/render/isometricRendererRuntime.js';

test('normalizeIsometricRendererOptions applies defaults and overrides', () => {
  assert.deepEqual(normalizeIsometricRendererOptions(), {
    quality: 'balanced',
    effectsEnabled: true,
    autoQuality: true,
    cameraTileWidth: 64,
    cameraTileHeight: 32,
  });

  assert.deepEqual(normalizeIsometricRendererOptions({
    quality: 'high',
    effectsEnabled: false,
    autoQuality: false,
    cameraTileWidth: 80,
    cameraTileHeight: 40,
  }), {
    quality: 'high',
    effectsEnabled: false,
    autoQuality: false,
    cameraTileWidth: 80,
    cameraTileHeight: 40,
  });
});

test('createIsometricRendererRuntime wires canvas and rendering subsystems', () => {
  const appended = [];
  const rootElement = {
    appendChild(node) {
      appended.push(node);
    },
  };
  const drawContexts = [];
  const documentObject = {
    createElement(tagName) {
      return {
        tagName,
        style: {},
        getContext: (type, options) => {
          const context = { type, options };
          drawContexts.push(context);
          return context;
        },
      };
    },
  };

  const runtime = createIsometricRendererRuntime({
    rootElement,
    options: {
      quality: 'high',
      autoQuality: false,
      cameraTileWidth: 70,
      cameraTileHeight: 35,
    },
    documentObject,
    performanceObject: { now: () => 1234 },
    buildingDefinitions: [{ id: 'hut' }],
    dependencies: {
      IsometricCameraClass: class {
        constructor(options) {
          this.options = options;
        }
      },
      AnimationManagerClass: class {
        constructor() {
          this.kind = 'animations';
        }
      },
      SpriteFactoryClass: class {
        constructor(options) {
          this.options = options;
          this.prewarmCalls = [];
        }

        prewarm(definitions) {
          this.prewarmCalls.push(definitions);
        }
      },
      ParticleSystemClass: class {
        constructor(options) {
          this.options = options;
        }
      },
      FrameQualityControllerClass: class {
        constructor(options) {
          this.options = options;
        }
      },
      ResourceGainTrackerClass: class {
        constructor(options) {
          this.options = options;
        }
      },
      TerrainLayerRendererClass: class {
        constructor(spriteFactory) {
          this.spriteFactory = spriteFactory;
        }
      },
    },
  });

  assert.equal(appended.length, 1);
  assert.equal(runtime.canvas, appended[0]);
  assert.equal(runtime.canvas.style.width, '100%');
  assert.equal(runtime.canvas.style.height, '100%');
  assert.equal(runtime.canvas.style.display, 'block');
  assert.equal(drawContexts.length, 1);
  assert.equal(runtime.ctx, drawContexts[0]);
  assert.deepEqual(runtime.options, {
    quality: 'high',
    effectsEnabled: true,
    autoQuality: false,
    cameraTileWidth: 70,
    cameraTileHeight: 35,
  });
  assert.deepEqual(runtime.camera.options, {
    tileWidth: 70,
    tileHeight: 35,
    zoom: 1.05,
    minZoom: 0.55,
    maxZoom: 2.8,
    worldRadius: 30,
  });
  assert.deepEqual(runtime.spriteFactory.options, { quality: 'high' });
  assert.deepEqual(runtime.spriteFactory.prewarmCalls, [[{ id: 'hut' }]]);
  assert.deepEqual(runtime.particles.options, { maxParticles: 900 });
  assert.deepEqual(runtime.qualityController.options, { enabled: false });
  assert.deepEqual(runtime.resourceGainTracker.options, { cooldownSeconds: 1.1, minDelta: 3 });
  assert.equal(runtime.terrainLayer.spriteFactory, runtime.spriteFactory);
  assert.equal(runtime.lastFrameAt, 1234);
  assert.equal(runtime.smoothedFps, 60);
  assert.equal(runtime.devicePixelRatio, 1);
  assert.equal(runtime.preview, null);
  assert.equal(runtime.selectedEntity, null);
  assert.equal(runtime.hoveredEntity, null);
  assert.equal(runtime.interactiveEntities.length, 0);
  assert.equal(runtime.colonistRenderState instanceof Map, true);
  assert.equal(runtime.knownBuildingIds instanceof Set, true);
});

