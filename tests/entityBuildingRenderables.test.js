import test from 'node:test';
import assert from 'node:assert/strict';
import { appendBuildingRenderables } from '../src/render/entityBuildingRenderables.js';

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

test('appendBuildingRenderables maps visible buildings into drawables and interactions', () => {
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

  assert.deepEqual(placementCalls, ['b1', 'b2']);
  assert.equal(renderables.length, 1);
  assert.equal(typeof renderables[0].draw, 'function');
  assert.equal(interactiveEntities.length, 1);
  assert.equal(interactiveEntities[0].entity.type, 'building');
  assert.equal(interactiveEntities[0].entity.id, 'b1');
});
