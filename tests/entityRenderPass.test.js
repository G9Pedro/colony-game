import test from 'node:test';
import assert from 'node:assert/strict';
import { isRectVisibleInViewport } from '../src/render/entityRenderPass.js';

test('isRectVisibleInViewport rejects rectangles fully outside viewport', () => {
  const visible = isRectVisibleInViewport({
    x: 920,
    y: 120,
    width: 40,
    height: 40,
    viewportWidth: 800,
    viewportHeight: 600,
    padding: 0,
  });
  assert.equal(visible, false);
});

test('isRectVisibleInViewport accepts partially overlapping rectangles', () => {
  const visible = isRectVisibleInViewport({
    x: 790,
    y: 560,
    width: 40,
    height: 40,
    viewportWidth: 800,
    viewportHeight: 600,
    padding: 0,
  });
  assert.equal(visible, true);
});

