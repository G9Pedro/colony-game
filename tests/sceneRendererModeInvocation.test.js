import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSceneRendererModeInitializationInvocation } from '../src/render/sceneRendererModeInvocation.js';

test('buildSceneRendererModeInitializationInvocation maps renderer state and dependencies', () => {
  const groundHandler = () => {};
  const previewHandler = () => {};
  const entityHandler = () => {};
  const persistRendererMode = () => {};
  const createIsometricRenderer = () => ({ id: 'iso' });
  const createThreeRenderer = () => ({ id: 'three' });
  const renderer = {
    activeRenderer: { id: 'active' },
    rootElement: { id: 'root' },
    _onGroundClick: groundHandler,
    _onPlacementPreview: previewHandler,
    _onEntitySelect: entityHandler,
    preview: { position: { x: 1, z: 2 }, valid: true },
    lastState: { tick: 42 },
  };

  const invocation = buildSceneRendererModeInitializationInvocation({
    renderer,
    mode: 'three',
    createIsometricRenderer,
    createThreeRenderer,
    persistRendererMode,
  });

  assert.equal(invocation.activeRenderer, renderer.activeRenderer);
  assert.equal(invocation.mode, 'three');
  assert.equal(invocation.rootElement, renderer.rootElement);
  assert.equal(invocation.createIsometricRenderer, createIsometricRenderer);
  assert.equal(invocation.createThreeRenderer, createThreeRenderer);
  assert.equal(invocation.persistRendererMode, persistRendererMode);
  assert.deepEqual(invocation.sessionPayload, {
    onGroundClick: groundHandler,
    onPlacementPreview: previewHandler,
    onEntitySelect: entityHandler,
    preview: renderer.preview,
    lastState: renderer.lastState,
  });
});

