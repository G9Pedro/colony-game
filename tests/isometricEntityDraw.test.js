import test from 'node:test';
import assert from 'node:assert/strict';
import { drawIsometricEntityPass } from '../src/render/isometricEntityDraw.js';

test('drawIsometricEntityPass sets interactive entities and draws in sorted depth order', () => {
  const drawCalls = [];
  const interactiveUpdates = [];
  const ctx = { id: 'ctx' };
  const lowDepth = {
    depth: 1,
    draw: (canvasContext) => drawCalls.push({ id: 'low', canvasContext }),
  };
  const highDepth = {
    depth: 4,
    draw: (canvasContext) => drawCalls.push({ id: 'high', canvasContext }),
  };

  const result = drawIsometricEntityPass({
    state: { id: 'state' },
    now: 100,
    daylight: 0.8,
    camera: { id: 'camera' },
    spriteFactory: { id: 'sprites' },
    animations: { id: 'animations' },
    particles: { id: 'particles' },
    colonistRenderState: new Map(),
    ctx,
    setInteractiveEntities: (next) => interactiveUpdates.push(next),
    buildRenderPass: () => ({
      interactiveEntities: [{ entity: { id: 'entity-1' } }],
      renderables: [highDepth, lowDepth],
    }),
  });

  assert.deepEqual(interactiveUpdates, [[{ entity: { id: 'entity-1' } }]]);
  assert.deepEqual(drawCalls, [
    { id: 'low', canvasContext: ctx },
    { id: 'high', canvasContext: ctx },
  ]);
  assert.deepEqual(result, {
    interactiveEntities: [{ entity: { id: 'entity-1' } }],
    renderCount: 2,
  });
});

test('drawIsometricEntityPass supports custom depth comparator', () => {
  const drawCalls = [];
  drawIsometricEntityPass({
    state: {},
    now: 0,
    daylight: 1,
    camera: {},
    spriteFactory: {},
    animations: {},
    particles: {},
    colonistRenderState: new Map(),
    ctx: {},
    setInteractiveEntities: () => {},
    compareDepth: (left, right) => right.depth - left.depth,
    buildRenderPass: () => ({
      interactiveEntities: [],
      renderables: [
        { depth: 2, draw: () => drawCalls.push(2) },
        { depth: 5, draw: () => drawCalls.push(5) },
      ],
    }),
  });

  assert.deepEqual(drawCalls, [5, 2]);
});

