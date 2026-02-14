import test from 'node:test';
import assert from 'node:assert/strict';
import {
  dispatchLegacyEntitySelectHandler,
  dispatchLegacyGroundClickHandler,
  dispatchLegacyPlacementPreviewHandler,
} from '../src/render/legacyRendererCallbacksDispatch.js';

test('legacy renderer callback dispatch applies ground click handler', () => {
  const renderer = {};
  const handler = () => {};
  const calls = [];

  dispatchLegacyGroundClickHandler(renderer, handler, {
    applyGroundClickHandler: (target, callback) => calls.push({ target, callback }),
  });

  assert.deepEqual(calls, [{ target: renderer, callback: handler }]);
});

test('legacy renderer callback dispatch applies placement preview handler', () => {
  const renderer = {};
  const handler = () => {};
  const calls = [];

  dispatchLegacyPlacementPreviewHandler(renderer, handler, {
    applyPlacementPreviewHandler: (target, callback) => calls.push({ target, callback }),
  });

  assert.deepEqual(calls, [{ target: renderer, callback: handler }]);
});

test('legacy renderer callback dispatch applies entity select handler', () => {
  const renderer = {};
  const handler = () => {};
  const calls = [];

  dispatchLegacyEntitySelectHandler(renderer, handler, {
    applyEntitySelectHandler: (target, callback) => calls.push({ target, callback }),
  });

  assert.deepEqual(calls, [{ target: renderer, callback: handler }]);
});

