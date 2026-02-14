import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyRendererEntitySelectHandler,
  applyRendererGroundClickHandler,
  applyRendererPlacementPreviewHandler,
} from '../src/render/rendererCallbackState.js';

test('renderer callback state helpers assign handler references', () => {
  const renderer = {
    onGroundClick: null,
    onPlacementPreview: null,
    onEntitySelect: null,
  };
  const groundHandler = () => {};
  const previewHandler = () => {};
  const entityHandler = () => {};

  applyRendererGroundClickHandler(renderer, groundHandler);
  applyRendererPlacementPreviewHandler(renderer, previewHandler);
  applyRendererEntitySelectHandler(renderer, entityHandler);

  assert.equal(renderer.onGroundClick, groundHandler);
  assert.equal(renderer.onPlacementPreview, previewHandler);
  assert.equal(renderer.onEntitySelect, entityHandler);
});

