import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveSceneRendererPreviewUpdate } from '../src/render/sceneRendererPreviewState.js';

test('resolveSceneRendererPreviewUpdate clears preview when position is missing', () => {
  assert.deepEqual(resolveSceneRendererPreviewUpdate(null, false), {
    shouldClear: true,
    position: null,
    valid: true,
    preview: null,
  });
  assert.deepEqual(resolveSceneRendererPreviewUpdate(undefined, true), {
    shouldClear: true,
    position: null,
    valid: true,
    preview: null,
  });
});

test('resolveSceneRendererPreviewUpdate keeps explicit preview payload when position exists', () => {
  const position = { x: 3, z: 4 };
  assert.deepEqual(resolveSceneRendererPreviewUpdate(position, false), {
    shouldClear: false,
    position,
    valid: false,
    preview: {
      position,
      valid: false,
    },
  });
});

