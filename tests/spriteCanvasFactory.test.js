import test from 'node:test';
import assert from 'node:assert/strict';
import { createSpriteCanvas, getSpriteContext2D } from '../src/render/spriteCanvasFactory.js';

test('createSpriteCanvas prefers OffscreenCanvas constructor when available', () => {
  const calls = [];
  class MockOffscreenCanvas {
    constructor(width, height) {
      this.width = width;
      this.height = height;
      calls.push({ width, height });
    }
  }

  const canvas = createSpriteCanvas(32, 48, {
    offscreenCanvasCtor: MockOffscreenCanvas,
    documentObject: null,
  });

  assert.equal(canvas.width, 32);
  assert.equal(canvas.height, 48);
  assert.deepEqual(calls, [{ width: 32, height: 48 }]);
});

test('createSpriteCanvas falls back to document canvas creation', () => {
  const created = [];
  const documentObject = {
    createElement: (tag) => {
      created.push(tag);
      return { width: 0, height: 0 };
    },
  };

  const canvas = createSpriteCanvas(64, 96, {
    offscreenCanvasCtor: null,
    documentObject,
  });

  assert.deepEqual(created, ['canvas']);
  assert.equal(canvas.width, 64);
  assert.equal(canvas.height, 96);
});

test('createSpriteCanvas throws when no creation strategy is available', () => {
  assert.throws(() => createSpriteCanvas(10, 12, {
    offscreenCanvasCtor: null,
    documentObject: null,
  }), /document object is required/i);
});

test('getSpriteContext2D requests alpha-enabled 2d context', () => {
  const calls = [];
  const canvas = {
    getContext: (...args) => {
      calls.push(args);
      return { id: 'ctx' };
    },
  };

  const ctx = getSpriteContext2D(canvas);
  assert.deepEqual(calls, [['2d', { alpha: true }]]);
  assert.deepEqual(ctx, { id: 'ctx' });
});

