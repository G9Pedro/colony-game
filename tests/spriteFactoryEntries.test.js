import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createBuildingSpriteEntry,
  createBuildingThumbnailEntry,
  createColonistSpriteEntry,
  createResourceIconEntry,
  createTerrainTileEntry,
} from '../src/render/spriteFactoryEntries.js';

function createCanvasStub(width, height) {
  return { width, height };
}

test('createTerrainTileEntry creates canvas and delegates terrain draw payload', () => {
  const calls = [];
  const canvas = createTerrainTileEntry({
    tileWidth: 64,
    tileHeight: 32,
    tilePadding: 6,
    kind: 'grass',
    variant: 2,
  }, {
    createCanvas: (w, h) => createCanvasStub(w, h),
    getContext: () => ({ id: 'ctx' }),
    drawTile: (payload) => calls.push(payload),
  });

  assert.deepEqual(canvas, { width: 70, height: 38 });
  assert.deepEqual(calls[0], {
    ctx: { id: 'ctx' },
    canvasWidth: 70,
    canvasHeight: 38,
    tileWidth: 64,
    tileHeight: 32,
    kind: 'grass',
    variant: 2,
  });
});

test('createBuildingSpriteEntry maps definition, overrides, and metrics', () => {
  const metrics = { anchorX: 80, anchorY: 120, width: 44, depth: 22 };
  const entry = createBuildingSpriteEntry({
    type: 'hut',
    construction: true,
    quality: 'high',
    spriteWidth: 160,
    spriteHeight: 160,
    buildingDefinitions: { hut: { id: 'hut', size: [2, 2, 2] } },
    buildingStyleOverrides: { hut: { roof: '#111' } },
  }, {
    createCanvas: (w, h) => createCanvasStub(w, h),
    getContext: () => ({ id: 'ctx' }),
    drawBuilding: ({ definition, override, quality, construction }) => {
      assert.equal(definition.id, 'hut');
      assert.equal(override.roof, '#111');
      assert.equal(quality, 'high');
      assert.equal(construction, true);
      return metrics;
    },
  });

  assert.deepEqual(entry, {
    canvas: { width: 160, height: 160 },
    ...metrics,
  });
});

test('create thumbnail/colonist/resource entries draw expected payloads', () => {
  const calls = [];
  createBuildingThumbnailEntry({
    source: { width: 160, height: 160 },
    size: 48,
  }, {
    createCanvas: (w, h) => createCanvasStub(w, h),
    getContext: () => ({ id: 'thumbCtx' }),
    drawThumbnail: (...args) => calls.push(['thumb', ...args]),
  });
  createColonistSpriteEntry({
    job: 'builder',
    frame: 1,
    idle: true,
    width: 24,
    height: 30,
  }, {
    createCanvas: (w, h) => createCanvasStub(w, h),
    getContext: () => ({ id: 'colonistCtx' }),
    drawColonist: (...args) => calls.push(['colonist', ...args]),
  });
  createResourceIconEntry({
    resourceKey: 'wood',
    size: 20,
  }, {
    createCanvas: (w, h) => createCanvasStub(w, h),
    getContext: () => ({ id: 'resourceCtx' }),
    drawResourceIcon: (...args) => calls.push(['resource', ...args]),
  });

  assert.deepEqual(calls[0], ['thumb', { id: 'thumbCtx' }, { width: 160, height: 160 }, 48]);
  assert.deepEqual(calls[1], ['colonist', { id: 'colonistCtx' }, { job: 'builder', frame: 1, idle: true }]);
  assert.deepEqual(calls[2], ['resource', { id: 'resourceCtx' }, { resourceKey: 'wood', size: 20 }]);
});

