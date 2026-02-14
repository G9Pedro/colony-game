import test from 'node:test';
import assert from 'node:assert/strict';
import { drawBuildingDecoration } from '../src/render/spriteBuildingDecorations.js';

function createDecorationContextStub() {
  const calls = [];
  return {
    calls,
    save: () => calls.push(['save']),
    restore: () => calls.push(['restore']),
    beginPath: () => calls.push(['beginPath']),
    moveTo: (...args) => calls.push(['moveTo', ...args]),
    lineTo: (...args) => calls.push(['lineTo', ...args]),
    stroke: () => calls.push(['stroke']),
    fill: () => calls.push(['fill']),
    closePath: () => calls.push(['closePath']),
    arc: (...args) => calls.push(['arc', ...args]),
    ellipse: (...args) => calls.push(['ellipse', ...args]),
    fillRect: (...args) => calls.push(['fillRect', ...args]),
    set strokeStyle(value) {
      calls.push(['strokeStyle', value]);
    },
    set fillStyle(value) {
      calls.push(['fillStyle', value]);
    },
    set lineWidth(value) {
      calls.push(['lineWidth', value]);
    },
  };
}

test('drawBuildingDecoration renders farm furrow strokes', () => {
  const ctx = createDecorationContextStub();
  drawBuildingDecoration(ctx, 'farm', 80, 110, 50, 24, 70);

  assert.deepEqual(ctx.calls.at(0), ['save']);
  assert.ok(ctx.calls.some((call) => call[0] === 'strokeStyle' && call[1] === 'rgba(108, 84, 30, 0.55)'));
  assert.ok(ctx.calls.filter((call) => call[0] === 'stroke').length >= 7);
  assert.deepEqual(ctx.calls.at(-1), ['restore']);
});

test('drawBuildingDecoration renders clinic cross mark', () => {
  const ctx = createDecorationContextStub();
  drawBuildingDecoration(ctx, 'clinic', 80, 110, 50, 24, 70);

  assert.ok(ctx.calls.some((call) => call[0] === 'strokeStyle' && call[1] === '#f0f4ff'));
  assert.ok(ctx.calls.some((call) => call[0] === 'moveTo' && call[1] === 75 && call[2] === 80));
  assert.ok(ctx.calls.some((call) => call[0] === 'lineTo' && call[1] === 85 && call[2] === 80));
});

test('drawBuildingDecoration keeps save/restore for unknown building types', () => {
  const ctx = createDecorationContextStub();
  drawBuildingDecoration(ctx, 'unknown', 80, 110, 50, 24, 70);

  assert.deepEqual(ctx.calls, [['save'], ['restore']]);
});

