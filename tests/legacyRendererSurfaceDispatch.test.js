import test from 'node:test';
import assert from 'node:assert/strict';
import {
  dispatchLegacyCameraCenter,
  dispatchLegacyEntityPickAtScreen,
  dispatchLegacyGroundPickAtScreen,
  dispatchLegacyPlacementMarker,
  dispatchLegacyPreviewClear,
  dispatchLegacyPreviewSet,
  dispatchLegacyViewportResize,
} from '../src/render/legacyRendererSurfaceDispatch.js';

function createRendererStub() {
  return {
    rootElement: { id: 'root' },
    camera: { id: 'camera' },
    renderer: { id: 'renderer' },
  };
}

test('dispatchLegacyViewportResize delegates viewport resize with renderer primitives', () => {
  const renderer = createRendererStub();
  const calls = [];

  dispatchLegacyViewportResize(renderer, {
    resizeViewport: (...args) => calls.push(args),
  });

  assert.deepEqual(calls, [[renderer.rootElement, renderer.camera, renderer.renderer]]);
});

test('dispatchLegacyGroundPickAtScreen delegates and returns ground pick result', () => {
  const renderer = createRendererStub();
  const marker = { x: 3, z: 7 };

  const result = dispatchLegacyGroundPickAtScreen(renderer, 44, 55, {
    pickGround: (target, clientX, clientY) => {
      assert.equal(target, renderer);
      assert.equal(clientX, 44);
      assert.equal(clientY, 55);
      return marker;
    },
  });

  assert.equal(result, marker);
});

test('dispatchLegacyEntityPickAtScreen delegates and returns entity pick result', () => {
  const renderer = createRendererStub();
  const entity = { id: 'hut-1' };

  const result = dispatchLegacyEntityPickAtScreen(renderer, 20, 30, {
    pickEntity: (target, clientX, clientY) => {
      assert.equal(target, renderer);
      assert.equal(clientX, 20);
      assert.equal(clientY, 30);
      return entity;
    },
  });

  assert.equal(result, entity);
});

test('dispatchLegacyPreviewSet and clear delegate preview operations', () => {
  const renderer = createRendererStub();
  const calls = [];
  const position = { x: 8, z: 9 };

  dispatchLegacyPreviewSet(renderer, position, false, {
    setPreview: (target, previewPosition, valid) => calls.push({ target, previewPosition, valid }),
  });
  dispatchLegacyPreviewClear(renderer, {
    clearPreview: (target) => calls.push({ target, clear: true }),
  });

  assert.deepEqual(calls, [
    { target: renderer, previewPosition: position, valid: false },
    { target: renderer, clear: true },
  ]);
});

test('dispatchLegacyPlacementMarker delegates marker updates', () => {
  const renderer = createRendererStub();
  const calls = [];
  const position = { x: 2, z: 6 };

  dispatchLegacyPlacementMarker(renderer, position, true, {
    updateMarker: (target, previewPosition, valid) => calls.push({ target, previewPosition, valid }),
  });

  assert.deepEqual(calls, [{ target: renderer, previewPosition: position, valid: true }]);
});

test('dispatchLegacyCameraCenter delegates center on building', () => {
  const renderer = createRendererStub();
  const building = { id: 'house-1' };
  const calls = [];

  dispatchLegacyCameraCenter(renderer, building, {
    centerCamera: (target, payload) => calls.push({ target, payload }),
  });

  assert.deepEqual(calls, [{ target: renderer, payload: building }]);
});

