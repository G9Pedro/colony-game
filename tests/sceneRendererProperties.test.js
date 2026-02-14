import test from 'node:test';
import assert from 'node:assert/strict';
import { defineSceneRendererCallbackProperties } from '../src/render/sceneRendererProperties.js';

test('defineSceneRendererCallbackProperties wires property setters to handler methods', () => {
  const calls = [];
  const renderer = {
    _onGroundClick: null,
    _onPlacementPreview: null,
    _onEntitySelect: null,
    setGroundClickHandler(handler) {
      this._onGroundClick = handler;
      calls.push({ method: 'setGroundClickHandler', handler });
    },
    setPlacementPreviewHandler(handler) {
      this._onPlacementPreview = handler;
      calls.push({ method: 'setPlacementPreviewHandler', handler });
    },
    setEntitySelectHandler(handler) {
      this._onEntitySelect = handler;
      calls.push({ method: 'setEntitySelectHandler', handler });
    },
  };
  const onGroundClick = () => {};
  const onPlacementPreview = () => {};
  const onEntitySelect = () => {};

  defineSceneRendererCallbackProperties(renderer);
  renderer.onGroundClick = onGroundClick;
  renderer.onPlacementPreview = onPlacementPreview;
  renderer.onEntitySelect = onEntitySelect;

  assert.equal(renderer.onGroundClick, onGroundClick);
  assert.equal(renderer.onPlacementPreview, onPlacementPreview);
  assert.equal(renderer.onEntitySelect, onEntitySelect);
  assert.deepEqual(calls, [
    { method: 'setGroundClickHandler', handler: onGroundClick },
    { method: 'setPlacementPreviewHandler', handler: onPlacementPreview },
    { method: 'setEntitySelectHandler', handler: onEntitySelect },
  ]);
});

