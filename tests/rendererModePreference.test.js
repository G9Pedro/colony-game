import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeRendererMode,
  persistRendererModePreference,
  readRendererModePreference,
  RENDERER_MODE_STORAGE_KEY,
} from '../src/render/rendererModePreference.js';

test('normalizeRendererMode whitelists supported values', () => {
  assert.equal(normalizeRendererMode('isometric'), 'isometric');
  assert.equal(normalizeRendererMode('three'), 'three');
  assert.equal(normalizeRendererMode('unknown'), 'isometric');
});

test('readRendererModePreference returns null on storage failures', () => {
  const storage = {
    getItem() {
      throw new Error('unavailable');
    },
  };
  assert.equal(readRendererModePreference(storage), null);
});

test('persistRendererModePreference writes normalized mode and reports success', () => {
  const writes = [];
  const storage = {
    setItem(key, value) {
      writes.push({ key, value });
    },
    getItem() {
      return null;
    },
  };

  assert.equal(persistRendererModePreference('three', storage), true);
  assert.equal(persistRendererModePreference('unsupported-mode', storage), true);
  assert.deepEqual(writes, [
    { key: RENDERER_MODE_STORAGE_KEY, value: 'three' },
    { key: RENDERER_MODE_STORAGE_KEY, value: 'isometric' },
  ]);
});

test('persistRendererModePreference returns false on storage failures', () => {
  const storage = {
    setItem() {
      throw new Error('blocked');
    },
    getItem() {
      return null;
    },
  };
  assert.equal(persistRendererModePreference('three', storage), false);
});

