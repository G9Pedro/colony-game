import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clearLegacyPreviewPosition,
  setLegacyPreviewPosition,
  updateLegacyPlacementPreview,
} from '../src/render/legacyPreviewHandlers.js';

function createRendererStub() {
  const colorCalls = [];
  return {
    previewMarker: {
      visible: false,
      position: { x: 0, z: 0 },
      material: {
        color: {
          setHex: (value) => colorCalls.push(value),
        },
      },
    },
    colorCalls,
  };
}

test('setLegacyPreviewPosition applies preview marker visibility and coordinates', () => {
  const renderer = createRendererStub();

  setLegacyPreviewPosition(renderer, { x: 4, z: 7 }, false);

  assert.equal(renderer.previewMarker.visible, true);
  assert.equal(renderer.previewMarker.position.x, 4);
  assert.equal(renderer.previewMarker.position.z, 7);
  assert.deepEqual(renderer.colorCalls, [0xef4444]);
});

test('clearLegacyPreviewPosition hides preview marker', () => {
  const renderer = createRendererStub();
  renderer.previewMarker.visible = true;

  clearLegacyPreviewPosition(renderer);

  assert.equal(renderer.previewMarker.visible, false);
});

test('updateLegacyPlacementPreview routes through preview setter behavior', () => {
  const renderer = createRendererStub();

  updateLegacyPlacementPreview(renderer, { x: 2, z: 3 }, true);

  assert.equal(renderer.previewMarker.visible, true);
  assert.equal(renderer.previewMarker.position.x, 2);
  assert.equal(renderer.previewMarker.position.z, 3);
  assert.deepEqual(renderer.colorCalls, [0x22c55e]);
});

