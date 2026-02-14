import test from 'node:test';
import assert from 'node:assert/strict';
import { createMainRenderer } from '../src/mainRendererBootstrap.js';

test('createMainRenderer uses scene renderer when available', () => {
  const root = { id: 'scene-root' };
  const sceneRenderer = { mode: 'isometric' };

  const result = createMainRenderer(root, {
    createSceneRenderer: (target) => {
      assert.equal(target, root);
      return sceneRenderer;
    },
    createFallbackRenderer: () => {
      throw new Error('fallback should not run');
    },
  });

  assert.deepEqual(result, {
    renderer: sceneRenderer,
    usingFallbackRenderer: false,
  });
});

test('createMainRenderer falls back when scene renderer throws', () => {
  const root = { id: 'scene-root' };
  const fallbackRenderer = { mode: 'fallback' };
  let fallbackCalls = 0;

  const result = createMainRenderer(root, {
    createSceneRenderer: () => {
      throw new Error('webgl unavailable');
    },
    createFallbackRenderer: (target) => {
      fallbackCalls += 1;
      assert.equal(target, root);
      return fallbackRenderer;
    },
  });

  assert.equal(fallbackCalls, 1);
  assert.deepEqual(result, {
    renderer: fallbackRenderer,
    usingFallbackRenderer: true,
  });
});
