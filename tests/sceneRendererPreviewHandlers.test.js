import test from 'node:test';
import assert from 'node:assert/strict';
import { applySceneRendererPreviewPosition, clearSceneRendererPreview } from '../src/render/sceneRendererPreviewHandlers.js';

function createSceneRendererStub() {
  const calls = [];
  return {
    preview: null,
    activeRenderer: {
      clearPreview: () => calls.push({ method: 'clearPreview' }),
      setPreviewPosition: (position, valid) => calls.push({ method: 'setPreviewPosition', position, valid }),
    },
    calls,
  };
}

test('applySceneRendererPreviewPosition stores preview and syncs active renderer', () => {
  const renderer = createSceneRendererStub();
  const position = { x: 4, z: 9 };

  applySceneRendererPreviewPosition(renderer, position, false);

  assert.deepEqual(renderer.preview, { position, valid: false });
  assert.deepEqual(renderer.calls, [{ method: 'setPreviewPosition', position, valid: false }]);
});

test('applySceneRendererPreviewPosition clears preview when position is null', () => {
  const renderer = createSceneRendererStub();

  applySceneRendererPreviewPosition(renderer, null, true);

  assert.equal(renderer.preview, null);
  assert.deepEqual(renderer.calls, [{ method: 'clearPreview' }]);
});

test('clearSceneRendererPreview resets state and clears active renderer', () => {
  const renderer = createSceneRendererStub();
  renderer.preview = { x: 1, z: 2, valid: true };

  clearSceneRendererPreview(renderer);

  assert.equal(renderer.preview, null);
  assert.deepEqual(renderer.calls, [{ method: 'clearPreview' }]);
});

test('scene renderer preview helpers tolerate missing active renderer', () => {
  const renderer = { preview: { x: 1, z: 1, valid: true }, activeRenderer: null };

  assert.doesNotThrow(() => applySceneRendererPreviewPosition(renderer, { x: 2, z: 2 }, true));
  assert.deepEqual(renderer.preview, { position: { x: 2, z: 2 }, valid: true });

  assert.doesNotThrow(() => clearSceneRendererPreview(renderer));
  assert.equal(renderer.preview, null);
});

