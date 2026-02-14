import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyIsometricPreviewPosition,
  clearIsometricPreview,
  updateIsometricPreviewMarker,
} from '../src/render/isometricPreviewHandlers.js';

test('applyIsometricPreviewPosition stores normalized preview state', () => {
  const renderer = { preview: null };

  applyIsometricPreviewPosition(renderer, { x: 4, z: 9 }, false);

  assert.deepEqual(renderer.preview, { x: 4, z: 9, valid: false });
});

test('clearIsometricPreview resets preview state', () => {
  const renderer = { preview: { x: 1, z: 2, valid: true } };

  clearIsometricPreview(renderer);

  assert.equal(renderer.preview, null);
});

test('updateIsometricPreviewMarker resolves placement marker preview state', () => {
  const renderer = { preview: null };
  const position = { x: 3, z: 8 };

  updateIsometricPreviewMarker(renderer, position, true);
  assert.deepEqual(renderer.preview, { x: 3, z: 8, valid: true });

  updateIsometricPreviewMarker(renderer, null, false);
  assert.equal(renderer.preview, null);
});

