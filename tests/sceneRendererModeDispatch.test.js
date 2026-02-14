import test from 'node:test';
import assert from 'node:assert/strict';
import { dispatchSceneRendererModeChange, getSceneRendererMode } from '../src/render/sceneRendererModeDispatch.js';

test('dispatchSceneRendererModeChange returns true without reinitializing when mode is unchanged', () => {
  const calls = [];
  const renderer = {
    mode: 'isometric',
    initializeRenderer: (mode) => calls.push(mode),
  };

  const changed = dispatchSceneRendererModeChange(renderer, 'isometric', {
    normalizeMode: (mode) => mode,
  });

  assert.equal(changed, true);
  assert.deepEqual(calls, []);
});

test('dispatchSceneRendererModeChange normalizes target mode and initializes renderer', () => {
  const calls = [];
  const renderer = {
    mode: 'isometric',
    initializeRenderer: (mode) => {
      calls.push(mode);
      renderer.mode = mode;
    },
  };

  const changed = dispatchSceneRendererModeChange(renderer, 'three', {
    normalizeMode: (mode) => mode,
  });

  assert.equal(changed, true);
  assert.deepEqual(calls, ['three']);
  assert.equal(renderer.mode, 'three');
});

test('dispatchSceneRendererModeChange returns false when initialization does not reach requested mode', () => {
  const renderer = {
    mode: 'isometric',
    initializeRenderer: () => {
      renderer.mode = 'isometric';
    },
  };

  const changed = dispatchSceneRendererModeChange(renderer, 'three', {
    normalizeMode: (mode) => mode,
  });

  assert.equal(changed, false);
});

test('getSceneRendererMode returns current scene renderer mode', () => {
  assert.equal(getSceneRendererMode({ mode: 'three' }), 'three');
});

