import test from 'node:test';
import assert from 'node:assert/strict';
import { buildBuildingSpriteGeometry, drawBuildingSpriteCanvas } from '../src/render/spriteBuildingRenderer.js';

function createBuildingContextStub() {
  const calls = [];
  return {
    calls,
    beginPath: () => calls.push(['beginPath']),
    ellipse: (...args) => calls.push(['ellipse', ...args]),
    fill: () => calls.push(['fill']),
    fillRect: (...args) => calls.push(['fillRect', ...args]),
    set fillStyle(value) {
      calls.push(['fillStyle', value]);
    },
  };
}

test('buildBuildingSpriteGeometry applies footprint and height scaling', () => {
  const geometry = buildBuildingSpriteGeometry({
    definition: { size: [2, 3, 1] },
    override: { footprint: 1.5, height: 2 },
    spriteWidth: 200,
    spriteHeight: 180,
  });

  assert.deepEqual(geometry, {
    centerX: 100,
    baseY: 136,
    width: 66,
    depth: 18,
    height: 108,
  });
});

test('drawBuildingSpriteCanvas coordinates delegates and returns sprite metrics', () => {
  const ctx = createBuildingContextStub();
  const delegateCalls = [];
  const metrics = drawBuildingSpriteCanvas({
    ctx,
    type: 'hut',
    definition: { size: [2, 2, 2] },
    override: {},
    quality: 'high',
    construction: true,
    deps: {
      shade: (color, factor) => `${color}:${factor}`,
      drawTile: (...args) => delegateCalls.push(['drawTile', ...args]),
      drawPrism: (...args) => {
        delegateCalls.push(['drawPrism', ...args]);
        return { topCenterY: 70 };
      },
      drawNoise: (...args) => delegateCalls.push(['drawNoise', ...args]),
      drawDecoration: (...args) => delegateCalls.push(['drawDecoration', ...args]),
      drawScaffold: (...args) => delegateCalls.push(['drawScaffold', ...args]),
    },
  });

  assert.equal(metrics.anchorX, 80);
  assert.equal(metrics.width, 44);
  assert.equal(metrics.depth, 22);
  assert.equal(metrics.anchorY, 129);
  assert.ok(delegateCalls.some((call) => call[0] === 'drawTile'));
  assert.ok(delegateCalls.some((call) => call[0] === 'drawNoise' && call[4] === 0.2));
  assert.ok(delegateCalls.some((call) => call[0] === 'drawScaffold'));
  assert.ok(ctx.calls.some((call) => call[0] === 'fillRect' && call[1] === 0 && call[2] === 0));
});

