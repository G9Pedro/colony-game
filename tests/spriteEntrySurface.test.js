import test from 'node:test';
import assert from 'node:assert/strict';
import { createSpriteEntrySurface } from '../src/render/spriteEntrySurface.js';

test('createSpriteEntrySurface creates canvas and context with injected deps', () => {
  const calls = [];
  const result = createSpriteEntrySurface({
    width: 96,
    height: 72,
  }, {
    createCanvas: (width, height) => {
      calls.push(['createCanvas', width, height]);
      return { width, height, kind: 'canvas' };
    },
    getContext: (canvas) => {
      calls.push(['getContext', canvas]);
      return { id: 'ctx' };
    },
  });

  assert.deepEqual(calls, [
    ['createCanvas', 96, 72],
    ['getContext', { width: 96, height: 72, kind: 'canvas' }],
  ]);
  assert.deepEqual(result, {
    canvas: { width: 96, height: 72, kind: 'canvas' },
    ctx: { id: 'ctx' },
  });
});
