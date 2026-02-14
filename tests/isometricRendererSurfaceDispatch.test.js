import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildIsometricCameraSnapshot,
  buildIsometricDebugSnapshot,
  dispatchIsometricCenterOnBuilding,
  dispatchIsometricEntitySelectHandler,
  dispatchIsometricGroundClickHandler,
  dispatchIsometricPlacementMarker,
  dispatchIsometricPlacementPreviewHandler,
  dispatchIsometricPreviewClear,
  dispatchIsometricPreviewSet,
} from '../src/render/isometricRendererSurfaceDispatch.js';

function createRendererStub() {
  return {
    camera: {
      centerOnCalls: [],
      centerOn(x, z) {
        this.centerOnCalls.push({ x, z });
      },
    },
  };
}

test('isometric surface dispatch forwards callback handler assignment', () => {
  const renderer = createRendererStub();
  const handler = () => {};
  const calls = [];

  dispatchIsometricGroundClickHandler(renderer, handler, {
    applyGroundClickHandler: (target, callback) => calls.push({ method: 'ground', target, callback }),
  });
  dispatchIsometricPlacementPreviewHandler(renderer, handler, {
    applyPlacementPreviewHandler: (target, callback) => calls.push({ method: 'preview', target, callback }),
  });
  dispatchIsometricEntitySelectHandler(renderer, handler, {
    applyEntitySelectHandler: (target, callback) => calls.push({ method: 'entity', target, callback }),
  });

  assert.deepEqual(calls, [
    { method: 'ground', target: renderer, callback: handler },
    { method: 'preview', target: renderer, callback: handler },
    { method: 'entity', target: renderer, callback: handler },
  ]);
});

test('isometric surface dispatch forwards preview set/clear/update operations', () => {
  const renderer = createRendererStub();
  const position = { x: 3, z: 9 };
  const calls = [];

  dispatchIsometricPreviewSet(renderer, position, false, {
    applyPreview: (target, previewPosition, valid) => calls.push({ method: 'set', target, previewPosition, valid }),
  });
  dispatchIsometricPreviewClear(renderer, {
    clearPreview: (target) => calls.push({ method: 'clear', target }),
  });
  dispatchIsometricPlacementMarker(renderer, position, true, {
    updateMarker: (target, previewPosition, valid) =>
      calls.push({ method: 'marker', target, previewPosition, valid }),
  });

  assert.deepEqual(calls, [
    { method: 'set', target: renderer, previewPosition: position, valid: false },
    { method: 'clear', target: renderer },
    { method: 'marker', target: renderer, previewPosition: position, valid: true },
  ]);
});

test('dispatchIsometricCenterOnBuilding centers camera and tolerates null building', () => {
  const renderer = createRendererStub();

  dispatchIsometricCenterOnBuilding(renderer, { x: 11, z: 4 });
  dispatchIsometricCenterOnBuilding(renderer, null);

  assert.deepEqual(renderer.camera.centerOnCalls, [{ x: 11, z: 4 }]);
});

test('camera/debug snapshot builders delegate to supplied builders', () => {
  const renderer = createRendererStub();
  const cameraSnapshot = { cameraX: 1 };
  const debugSnapshot = { fps: 60 };

  const cameraResult = buildIsometricCameraSnapshot(renderer, {
    buildCameraState: (target) => {
      assert.equal(target, renderer);
      return cameraSnapshot;
    },
  });

  const debugResult = buildIsometricDebugSnapshot(renderer, {
    buildDebugStats: (target) => {
      assert.equal(target, renderer);
      return debugSnapshot;
    },
  });

  assert.equal(cameraResult, cameraSnapshot);
  assert.equal(debugResult, debugSnapshot);
});

