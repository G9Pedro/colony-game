import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyFallbackEntitySelectHandler,
  applyFallbackGroundClickHandler,
  applyFallbackPlacementPreviewHandler,
  applyFallbackPreviewPosition,
  buildFallbackCameraState,
  buildFallbackDebugStats,
  centerFallbackOnBuilding,
  clearFallbackPreview,
  disposeFallbackRenderer,
  renderFallbackFrame,
  resizeFallbackRenderer,
  updateFallbackPlacementMarker,
} from '../src/render/fallbackRendererDispatch.js';

function createFallbackStub() {
  const calls = [];
  const cameraState = { cameraX: 2, cameraY: 3 };
  const debugStats = { fps: 60 };
  return {
    calls,
    renderer: {
      delegate: {
        setGroundClickHandler: (handler) => calls.push({ method: 'setGroundClickHandler', handler }),
        setPlacementPreviewHandler: (handler) => calls.push({ method: 'setPlacementPreviewHandler', handler }),
        setEntitySelectHandler: (handler) => calls.push({ method: 'setEntitySelectHandler', handler }),
        setPreviewPosition: (position, valid) => calls.push({ method: 'setPreviewPosition', position, valid }),
        clearPreview: () => calls.push({ method: 'clearPreview' }),
        updatePlacementMarker: (position, valid) => calls.push({ method: 'updatePlacementMarker', position, valid }),
        centerOnBuilding: (building) => calls.push({ method: 'centerOnBuilding', building }),
        getCameraState: () => cameraState,
        getDebugStats: () => debugStats,
        resize: () => calls.push({ method: 'resize' }),
        render: (state) => calls.push({ method: 'render', state }),
        dispose: () => calls.push({ method: 'dispose' }),
      },
    },
    cameraState,
    debugStats,
  };
}

test('fallback dispatch helper methods forward handler and preview operations', () => {
  const { renderer, calls } = createFallbackStub();
  const handler = () => {};
  const position = { x: 5, z: 4 };

  applyFallbackGroundClickHandler(renderer, handler);
  applyFallbackPlacementPreviewHandler(renderer, handler);
  applyFallbackEntitySelectHandler(renderer, handler);
  applyFallbackPreviewPosition(renderer, position, false);
  clearFallbackPreview(renderer);
  updateFallbackPlacementMarker(renderer, position, true);

  assert.deepEqual(calls, [
    { method: 'setGroundClickHandler', handler },
    { method: 'setPlacementPreviewHandler', handler },
    { method: 'setEntitySelectHandler', handler },
    { method: 'setPreviewPosition', position, valid: false },
    { method: 'clearPreview' },
    { method: 'updatePlacementMarker', position, valid: true },
  ]);
});

test('fallback dispatch helper methods forward lifecycle and frame methods', () => {
  const { renderer, calls } = createFallbackStub();
  const state = { tick: 3 };
  const building = { id: 'hut-1' };

  centerFallbackOnBuilding(renderer, building);
  resizeFallbackRenderer(renderer);
  renderFallbackFrame(renderer, state);
  disposeFallbackRenderer(renderer);

  assert.deepEqual(calls, [
    { method: 'centerOnBuilding', building },
    { method: 'resize' },
    { method: 'render', state },
    { method: 'dispose' },
  ]);
});

test('fallback debug and camera snapshot helpers return delegate values', () => {
  const { renderer, cameraState, debugStats } = createFallbackStub();

  assert.equal(buildFallbackCameraState(renderer), cameraState);
  assert.equal(buildFallbackDebugStats(renderer), debugStats);
});

test('buildFallbackDebugStats falls back to null when delegate has no getter', () => {
  const renderer = {
    delegate: {
      getCameraState: () => ({ cameraX: 0 }),
    },
  };

  assert.equal(buildFallbackDebugStats(renderer), null);
});

