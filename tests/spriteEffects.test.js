import test from 'node:test';
import assert from 'node:assert/strict';
import { drawScaffoldOverlay, drawTextureNoise } from '../src/render/spriteEffects.js';

function createEffectContextStub() {
  const calls = [];
  return {
    calls,
    beginPath: () => calls.push(['beginPath']),
    moveTo: (...args) => calls.push(['moveTo', ...args]),
    lineTo: (...args) => calls.push(['lineTo', ...args]),
    stroke: () => calls.push(['stroke']),
    fillRect: (...args) => calls.push(['fillRect', ...args]),
    save: () => calls.push(['save']),
    restore: () => calls.push(['restore']),
    set fillStyle(value) {
      calls.push(['fillStyle', value]);
    },
    set strokeStyle(value) {
      calls.push(['strokeStyle', value]);
    },
    set lineWidth(value) {
      calls.push(['lineWidth', value]);
    },
  };
}

test('drawTextureNoise writes deterministic texture pixels', () => {
  const ctxA = createEffectContextStub();
  const ctxB = createEffectContextStub();
  drawTextureNoise(ctxA, 100, 50, 0.2, 12);
  drawTextureNoise(ctxB, 100, 50, 0.2, 12);

  const pixelWrites = ctxA.calls.filter((call) => call[0] === 'fillRect');
  const secondPixelWrites = ctxB.calls.filter((call) => call[0] === 'fillRect');
  assert.equal(pixelWrites.length, Math.floor(100 * 50 * 0.2 * 0.02));
  assert.deepEqual(pixelWrites, secondPixelWrites);
});

test('drawScaffoldOverlay renders vertical and horizontal scaffold strokes', () => {
  const ctx = createEffectContextStub();
  drawScaffoldOverlay(ctx, 100, 80);

  assert.deepEqual(ctx.calls.slice(0, 3), [
    ['save'],
    ['strokeStyle', 'rgba(203, 163, 84, 0.65)'],
    ['lineWidth', 2],
  ]);
  assert.ok(ctx.calls.some((call) => call[0] === 'moveTo' && call[1] === 18 && call[2] === 62));
  assert.ok(ctx.calls.some((call) => call[0] === 'moveTo' && call[1] === 14 && call[2] === 60));
  assert.deepEqual(ctx.calls.at(-1), ['restore']);
});

