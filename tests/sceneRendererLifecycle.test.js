import test from 'node:test';
import assert from 'node:assert/strict';
import {
  initializeSceneRendererMode,
  instantiateSceneRenderer,
  syncSceneRendererSession,
} from '../src/render/sceneRendererLifecycle.js';

function createMockRenderer() {
  return {
    calls: [],
    setGroundClickHandler(handler) {
      this.calls.push(['ground', handler]);
    },
    setPlacementPreviewHandler(handler) {
      this.calls.push(['preview', handler]);
    },
    setEntitySelectHandler(handler) {
      this.calls.push(['entity', handler]);
    },
    updatePlacementMarker(position, valid) {
      this.calls.push(['marker', position, valid]);
    },
    render(state) {
      this.calls.push(['render', state]);
    },
  };
}

test('instantiateSceneRenderer uses requested renderer mode when available', () => {
  const threeRenderer = createMockRenderer();
  const result = instantiateSceneRenderer({
    mode: 'three',
    rootElement: { id: 'root' },
    createIsometricRenderer: () => createMockRenderer(),
    createThreeRenderer: () => threeRenderer,
  });

  assert.equal(result.mode, 'three');
  assert.equal(result.renderer, threeRenderer);
});

test('instantiateSceneRenderer falls back to low isometric renderer on failure', () => {
  const calls = [];
  const fallbackRenderer = createMockRenderer();
  const result = instantiateSceneRenderer({
    mode: 'three',
    rootElement: { id: 'root' },
    createIsometricRenderer: (_rootElement, options) => {
      calls.push(options);
      return fallbackRenderer;
    },
    createThreeRenderer: () => {
      throw new Error('three init failed');
    },
  });

  assert.equal(result.mode, 'isometric');
  assert.equal(result.renderer, fallbackRenderer);
  assert.deepEqual(calls, [{ quality: 'low', effectsEnabled: false }]);
});

test('syncSceneRendererSession rehydrates handlers, preview, and last state', () => {
  const renderer = createMockRenderer();
  const payload = {
    onGroundClick: () => {},
    onPlacementPreview: () => {},
    onEntitySelect: () => {},
    preview: { position: { x: 4, z: -1 }, valid: false },
    lastState: { tick: 120 },
  };

  syncSceneRendererSession(renderer, payload);
  assert.deepEqual(renderer.calls, [
    ['ground', payload.onGroundClick],
    ['preview', payload.onPlacementPreview],
    ['entity', payload.onEntitySelect],
    ['marker', { x: 4, z: -1 }, false],
    ['render', { tick: 120 }],
  ]);
});

test('initializeSceneRendererMode disposes previous renderer and syncs new session', () => {
  const disposed = [];
  const syncCalls = [];
  const previousRenderer = {
    dispose() {
      disposed.push('disposed');
    },
  };
  const nextRenderer = createMockRenderer();
  const payload = {
    onGroundClick: () => {},
    onPlacementPreview: () => {},
    onEntitySelect: () => {},
    preview: null,
    lastState: null,
  };
  const persistedModes = [];

  const result = initializeSceneRendererMode({
    activeRenderer: previousRenderer,
    mode: 'three',
    rootElement: { id: 'root' },
    createIsometricRenderer: () => createMockRenderer(),
    createThreeRenderer: () => nextRenderer,
    persistRendererMode: (mode) => persistedModes.push(mode),
    sessionPayload: payload,
    syncRendererSession: (renderer, sessionPayload) => {
      syncCalls.push({ renderer, sessionPayload });
    },
  });

  assert.equal(result.mode, 'three');
  assert.equal(result.renderer, nextRenderer);
  assert.deepEqual(disposed, ['disposed']);
  assert.deepEqual(persistedModes, ['three']);
  assert.deepEqual(syncCalls, [{ renderer: nextRenderer, sessionPayload: payload }]);
});

