import test from 'node:test';
import assert from 'node:assert/strict';
import { createIsometricPreviewState, resolveIsometricPreviewUpdate } from '../src/render/isometricPreviewState.js';

test('createIsometricPreviewState maps position payload to preview state', () => {
  const preview = createIsometricPreviewState({ x: 4, z: -2 }, false);
  assert.deepEqual(preview, {
    x: 4,
    z: -2,
    valid: false,
  });
});

test('createIsometricPreviewState returns null for missing position', () => {
  assert.equal(createIsometricPreviewState(null, true), null);
});

test('resolveIsometricPreviewUpdate mirrors preview creation behavior', () => {
  assert.deepEqual(resolveIsometricPreviewUpdate({ x: 1, z: 2 }, true), {
    x: 1,
    z: 2,
    valid: true,
  });
  assert.equal(resolveIsometricPreviewUpdate(undefined, false), null);
});

