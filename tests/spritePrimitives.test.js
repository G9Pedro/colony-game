import test from 'node:test';
import assert from 'node:assert/strict';
import { drawDiamond, drawIsoPrism } from '../src/render/spritePrimitives.js';

function createPathContextStub() {
  const calls = [];
  return {
    calls,
    beginPath: () => calls.push(['beginPath']),
    moveTo: (...args) => calls.push(['moveTo', ...args]),
    lineTo: (...args) => calls.push(['lineTo', ...args]),
    closePath: () => calls.push(['closePath']),
    fill: () => calls.push(['fill']),
    stroke: () => calls.push(['stroke']),
    set fillStyle(value) {
      calls.push(['fillStyle', value]);
    },
    set strokeStyle(value) {
      calls.push(['strokeStyle', value]);
    },
  };
}

test('drawDiamond traces rhombus path and optional stroke', () => {
  const ctx = createPathContextStub();
  drawDiamond(ctx, 50, 60, 40, 20, '#abc', '#def');

  assert.deepEqual(ctx.calls.slice(0, 7), [
    ['beginPath'],
    ['moveTo', 50, 50],
    ['lineTo', 70, 60],
    ['lineTo', 50, 70],
    ['lineTo', 30, 60],
    ['closePath'],
    ['fillStyle', '#abc'],
  ]);
  assert.ok(ctx.calls.some((call) => call[0] === 'strokeStyle' && call[1] === '#def'));
  assert.ok(ctx.calls.some((call) => call[0] === 'stroke'));
});

test('drawIsoPrism returns top metrics from prism geometry', () => {
  const ctx = createPathContextStub();
  const result = drawIsoPrism(ctx, {
    cx: 80,
    baseY: 100,
    width: 40,
    depth: 20,
    height: 30,
    topColor: '#aaa',
    leftColor: '#bbb',
    rightColor: '#ccc',
  });

  assert.deepEqual(result, {
    topCenterY: 70,
    topSouthY: 80,
  });
  assert.ok(ctx.calls.filter((call) => call[0] === 'beginPath').length >= 3);
  assert.ok(ctx.calls.some((call) => call[0] === 'stroke'));
});

