import test from 'node:test';
import assert from 'node:assert/strict';
import { appendConstructionRenderables } from '../src/render/entityConstructionRenderables.js';

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

test('appendConstructionRenderables appends drawables only for visible construction tiles', () => {
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
