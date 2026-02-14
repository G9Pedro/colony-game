import test from 'node:test';
import assert from 'node:assert/strict';
import {
  appendBuildingRenderables,
  appendColonistRenderables,
  appendConstructionRenderables,
} from '../src/render/entityRenderables.js';

function createCamera() {
  return {
    zoom: 1,
    viewportWidth: 800,
    viewportHeight: 600,
    worldToScreen: (x, z) => ({
      x: 200 + x * 20,
      y: 200 + z * 20,
    }),
  };
}

test('appendConstructionRenderables appends only visible construction entries', () => {
  const renderables = [];
  appendConstructionRenderables({
    state: {
      constructionQueue: [
        { type: 'hut', x: 0, z: 0, progress: 3, buildTime: 6 },
        { type: 'hut', x: 200, z: 0, progress: 1, buildTime: 6 },
      ],
    },
    camera: createCamera(),
    spriteFactory: {
      getBuildingSprite: () => ({
        canvas: { width: 100, height: 80 },
        anchorX: 50,
        anchorY: 60,
      }),
    },
    renderables,
  });

  assert.equal(renderables.length, 1);
  assert.ok(Math.abs(renderables[0].depth - 0.04) < 0.0000001);
  assert.equal(typeof renderables[0].draw, 'function');
});

test('appendBuildingRenderables appends visible building drawables and interactive payloads', () => {
  const renderables = [];
  const interactiveEntities = [];
  const placementCalls = [];
  appendBuildingRenderables({
    state: {
      buildings: [
        { id: 'b1', type: 'house', x: 1, z: 2 },
        { id: 'b2', type: 'house', x: 300, z: 0 },
      ],
    },
    now: 1000,
    daylight: 0.2,
    camera: createCamera(),
    spriteFactory: {
      getBuildingSprite: () => ({
        canvas: { width: 100, height: 100 },
        anchorX: 50,
        anchorY: 70,
      }),
    },
    animations: {
      getPlacementScale: (id, now) => {
        placementCalls.push(id);
        assert.equal(now, 1000);
        return 1;
      },
    },
    renderables,
    interactiveEntities,
  });

  assert.equal(renderables.length, 1);
  assert.equal(interactiveEntities.length, 1);
  assert.deepEqual(placementCalls, ['b1', 'b2']);
  assert.equal(interactiveEntities[0].entity.type, 'building');
  assert.equal(interactiveEntities[0].entity.id, 'b1');
  assert.equal(typeof renderables[0].draw, 'function');
});

test('appendColonistRenderables appends only alive mapped colonists and propagates idle flag', () => {
  const renderables = [];
  const interactiveEntities = [];
  const spriteCalls = [];
  appendColonistRenderables({
    state: {
      timeSeconds: 12,
      colonists: [
        { id: 'c1', alive: true, age: 4, job: 'builder', task: 'Idle' },
        { id: 'c2', alive: false, age: 4, job: 'builder', task: 'Idle' },
        { id: 'c3', alive: true, age: 1, job: 'builder', task: 'Working' },
      ],
    },
    camera: createCamera(),
    spriteFactory: {
      getColonistSprite: (...args) => {
        spriteCalls.push(args);
        return { width: 20, height: 30 };
      },
    },
    colonistRenderState: new Map([
      ['c1', { x: 1, z: 2 }],
    ]),
    renderables,
    interactiveEntities,
  });

  assert.equal(spriteCalls.length, 1);
  assert.equal(spriteCalls[0][0], 'builder');
  assert.equal(spriteCalls[0][2].idle, true);
  assert.equal(renderables.length, 1);
  assert.equal(interactiveEntities.length, 1);
  assert.equal(interactiveEntities[0].entity.type, 'colonist');
  assert.equal(interactiveEntities[0].entity.id, 'c1');
});
