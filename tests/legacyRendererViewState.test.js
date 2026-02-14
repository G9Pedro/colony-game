import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyLegacyPreviewMarker,
  buildLegacyCameraStatePayload,
  buildLegacyDebugStatsPayload,
} from '../src/render/legacyRendererViewState.js';

test('buildLegacyCameraStatePayload maps root and camera target values', () => {
  const payload = buildLegacyCameraStatePayload(
    { clientWidth: 1280, clientHeight: 720 },
    { x: 12, z: -5 },
    42,
  );
  assert.deepEqual(payload, {
    mode: 'three',
    projection: 'perspective',
    centerX: 12,
    centerZ: -5,
    zoom: 1,
    width: 1280,
    height: 720,
    worldRadius: 42,
  });
});

test('buildLegacyDebugStatsPayload creates normalized legacy stats payload', () => {
  assert.deepEqual(buildLegacyDebugStatsPayload(57.4), {
    mode: 'three',
    fps: 57.4,
    quality: 1,
    particles: 0,
    particleCap: 0,
  });
});

test('applyLegacyPreviewMarker updates marker position and visibility', () => {
  const colorCalls = [];
  const previewMarker = {
    visible: false,
    position: { x: 0, z: 0 },
    material: {
      color: {
        setHex: (value) => colorCalls.push(value),
      },
    },
  };

  applyLegacyPreviewMarker(previewMarker, { x: 4, z: 9 }, true);
  assert.equal(previewMarker.visible, true);
  assert.equal(previewMarker.position.x, 4);
  assert.equal(previewMarker.position.z, 9);
  assert.deepEqual(colorCalls, [0x22c55e]);

  applyLegacyPreviewMarker(previewMarker, { x: 7, z: 3 }, false);
  assert.equal(previewMarker.position.x, 7);
  assert.equal(previewMarker.position.z, 3);
  assert.deepEqual(colorCalls, [0x22c55e, 0xef4444]);

  applyLegacyPreviewMarker(previewMarker, null);
  assert.equal(previewMarker.visible, false);
});

