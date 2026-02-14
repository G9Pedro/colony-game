import test from 'node:test';
import assert from 'node:assert/strict';
import { initializeSceneRenderer } from '../src/render/sceneRendererInitialization.js';

test('initializeSceneRenderer assigns base state and initializes with normalized preference', () => {
  const rootElement = { id: 'root' };
  const renderer = {
    initializeRendererCalls: [],
    initializeRenderer(mode) {
      this.initializeRendererCalls.push(mode);
    },
  };
  const callbackTargets = [];
  const normalizedInputs = [];

  initializeSceneRenderer(renderer, {
    rootElement,
    readModePreference: () => 'three',
    normalizeMode: (mode) => {
      normalizedInputs.push(mode);
      return `normalized:${mode}`;
    },
    defineCallbackProperties: (target) => {
      callbackTargets.push(target);
    },
  });

  assert.equal(renderer.rootElement, rootElement);
  assert.equal(renderer._onGroundClick, null);
  assert.equal(renderer._onPlacementPreview, null);
  assert.equal(renderer._onEntitySelect, null);
  assert.equal(renderer.preview, null);
  assert.equal(renderer.mode, 'normalized:three');
  assert.equal(renderer.activeRenderer, null);
  assert.equal(renderer.lastState, null);
  assert.deepEqual(normalizedInputs, ['three']);
  assert.deepEqual(callbackTargets, [renderer]);
  assert.deepEqual(renderer.initializeRendererCalls, ['normalized:three']);
});

test('initializeSceneRenderer falls back to isometric mode when preference is empty', () => {
  const renderer = {
    initializeRendererCalls: [],
    initializeRenderer(mode) {
      this.initializeRendererCalls.push(mode);
    },
  };
  const normalizedInputs = [];

  initializeSceneRenderer(renderer, {
    rootElement: { id: 'root' },
    readModePreference: () => null,
    normalizeMode: (mode) => {
      normalizedInputs.push(mode);
      return mode;
    },
    defineCallbackProperties: () => {},
  });

  assert.deepEqual(normalizedInputs, ['isometric']);
  assert.equal(renderer.mode, 'isometric');
  assert.deepEqual(renderer.initializeRendererCalls, ['isometric']);
});

