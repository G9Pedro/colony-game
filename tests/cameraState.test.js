import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeCameraState } from '../src/render/cameraState.js';

test('normalizeCameraState returns safe defaults for missing payload', () => {
  assert.deepEqual(normalizeCameraState(null), {
    mode: 'isometric',
    projection: 'isometric',
    centerX: 0,
    centerZ: 0,
    zoom: 1,
    width: 1,
    height: 1,
    tileWidth: 64,
    tileHeight: 32,
    worldRadius: 30,
  });
});

test('normalizeCameraState keeps isometric tile metrics and clamps invalid values', () => {
  const normalized = normalizeCameraState({
    mode: 'isometric',
    projection: 'isometric',
    centerX: 4.5,
    centerZ: -2.5,
    zoom: -5,
    width: 0,
    height: Number.NaN,
    tileWidth: 72,
    tileHeight: 36,
    worldRadius: -10,
  });

  assert.deepEqual(normalized, {
    mode: 'isometric',
    projection: 'isometric',
    centerX: 4.5,
    centerZ: -2.5,
    zoom: 0.0001,
    width: 0.0001,
    height: 1,
    tileWidth: 72,
    tileHeight: 36,
    worldRadius: 0.0001,
  });
});

test('normalizeCameraState strips tile metrics for perspective cameras', () => {
  const normalized = normalizeCameraState({
    mode: 'three',
    projection: 'perspective',
    centerX: 3,
    centerZ: -7,
    zoom: 1,
    width: 1200,
    height: 700,
    tileWidth: 64,
    tileHeight: 32,
    worldRadius: 30,
  }, {
    mode: 'three',
    projection: 'perspective',
  });

  assert.deepEqual(normalized, {
    mode: 'three',
    projection: 'perspective',
    centerX: 3,
    centerZ: -7,
    zoom: 1,
    width: 1200,
    height: 700,
    tileWidth: null,
    tileHeight: null,
    worldRadius: 30,
  });
});

