import test from 'node:test';
import assert from 'node:assert/strict';
import {
  drawMinimapColonistDots,
  drawMinimapSelectionRing,
  drawMinimapSquareEntities,
  drawMinimapSurface,
} from '../src/ui/minimapPainter.js';

function createContextStub() {
  const calls = [];
  const gradientStops = [];
  const gradient = {
    addColorStop: (offset, color) => gradientStops.push({ offset, color }),
  };
  return {
    calls,
    gradientStops,
    createLinearGradient: (...args) => {
      calls.push({ method: 'createLinearGradient', args });
      return gradient;
    },
    fillRect: (...args) => calls.push({ method: 'fillRect', args }),
    strokeRect: (...args) => calls.push({ method: 'strokeRect', args }),
    beginPath: () => calls.push({ method: 'beginPath' }),
    arc: (...args) => calls.push({ method: 'arc', args }),
    fill: () => calls.push({ method: 'fill' }),
    stroke: () => calls.push({ method: 'stroke' }),
    set fillStyle(value) {
      calls.push({ method: 'setFillStyle', value });
    },
    set strokeStyle(value) {
      calls.push({ method: 'setStrokeStyle', value });
    },
    set lineWidth(value) {
      calls.push({ method: 'setLineWidth', value });
    },
  };
}

test('drawMinimapSurface paints gradient fill and frame stroke', () => {
  const ctx = createContextStub();
  drawMinimapSurface(ctx, 120, 80);

  assert.deepEqual(ctx.gradientStops, [
    { offset: 0, color: '#6b5b3d' },
    { offset: 1, color: '#4f422d' },
  ]);
  assert.ok(ctx.calls.some((call) => call.method === 'fillRect'));
  assert.ok(ctx.calls.some((call) => call.method === 'strokeRect'));
});

test('drawMinimapSquareEntities projects entries to square markers', () => {
  const ctx = createContextStub();
  const entries = [{ x: 1 }, { x: 2 }];
  const calls = [];

  drawMinimapSquareEntities(ctx, entries, {
    color: '#fff',
    size: 4,
    project: (entry) => {
      calls.push(entry);
      return { x: entry.x * 10, y: entry.x * 20 };
    },
  });

  assert.deepEqual(calls, entries);
  assert.equal(ctx.calls.filter((call) => call.method === 'fillRect').length, 2);
});

test('drawMinimapColonistDots renders alive colonists only', () => {
  const ctx = createContextStub();
  const colonists = [
    { alive: true, id: 'a' },
    { alive: false, id: 'b' },
    { alive: true, id: 'c' },
  ];
  const projected = [];

  drawMinimapColonistDots(ctx, colonists, {
    project: (colonist) => {
      projected.push(colonist.id);
      return { x: 5, y: 7 };
    },
  });

  assert.deepEqual(projected, ['a', 'c']);
  assert.equal(ctx.calls.filter((call) => call.method === 'arc').length, 2);
});

test('drawMinimapSelectionRing skips empty selection and draws ring otherwise', () => {
  const ctx = createContextStub();
  const projected = [];

  drawMinimapSelectionRing(ctx, null, {
    project: () => ({ x: 0, y: 0 }),
  });
  assert.equal(ctx.calls.filter((call) => call.method === 'arc').length, 0);

  drawMinimapSelectionRing(ctx, { id: 'selected' }, {
    project: (entity) => {
      projected.push(entity.id);
      return { x: 9, y: 11 };
    },
  });

  assert.deepEqual(projected, ['selected']);
  assert.equal(ctx.calls.filter((call) => call.method === 'arc').length, 1);
});

