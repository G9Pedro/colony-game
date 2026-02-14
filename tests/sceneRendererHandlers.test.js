import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applySceneRendererEntitySelectHandler,
  applySceneRendererGroundClickHandler,
  applySceneRendererPlacementPreviewHandler,
} from '../src/render/sceneRendererHandlers.js';

function createSceneRendererStub() {
  const calls = [];
  return {
    calls,
    _onGroundClick: null,
    _onPlacementPreview: null,
    _onEntitySelect: null,
    activeRenderer: {
      setGroundClickHandler: (handler) => calls.push({ method: 'setGroundClickHandler', handler }),
      setPlacementPreviewHandler: (handler) => calls.push({ method: 'setPlacementPreviewHandler', handler }),
      setEntitySelectHandler: (handler) => calls.push({ method: 'setEntitySelectHandler', handler }),
    },
  };
}

test('scene renderer handler appliers persist callbacks and sync active renderer', () => {
  const renderer = createSceneRendererStub();
  const groundHandler = () => {};
  const previewHandler = () => {};
  const entityHandler = () => {};

  applySceneRendererGroundClickHandler(renderer, groundHandler);
  applySceneRendererPlacementPreviewHandler(renderer, previewHandler);
  applySceneRendererEntitySelectHandler(renderer, entityHandler);

  assert.equal(renderer._onGroundClick, groundHandler);
  assert.equal(renderer._onPlacementPreview, previewHandler);
  assert.equal(renderer._onEntitySelect, entityHandler);
  assert.deepEqual(renderer.calls, [
    { method: 'setGroundClickHandler', handler: groundHandler },
    { method: 'setPlacementPreviewHandler', handler: previewHandler },
    { method: 'setEntitySelectHandler', handler: entityHandler },
  ]);
});

test('scene renderer handler appliers tolerate missing active renderer', () => {
  const renderer = {
    _onGroundClick: null,
    _onPlacementPreview: null,
    _onEntitySelect: null,
    activeRenderer: null,
  };

  assert.doesNotThrow(() => applySceneRendererGroundClickHandler(renderer, () => {}));
  assert.doesNotThrow(() => applySceneRendererPlacementPreviewHandler(renderer, () => {}));
  assert.doesNotThrow(() => applySceneRendererEntitySelectHandler(renderer, () => {}));
});

