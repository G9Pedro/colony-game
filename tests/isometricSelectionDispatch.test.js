import test from 'node:test';
import assert from 'node:assert/strict';
import {
  dispatchIsometricClickSelection,
  dispatchIsometricEntitySelection,
  dispatchIsometricHoverSelection,
} from '../src/render/isometricSelectionDispatch.js';

test('dispatchIsometricHoverSelection builds invocation and dispatches hover handler', () => {
  const renderer = { id: 'renderer' };
  const calls = [];

  dispatchIsometricHoverSelection(renderer, 12, 14, {
    buildInvocation: (nextRenderer, x, y) => {
      calls.push({ method: 'buildInvocation', nextRenderer, x, y });
      return { payload: 'hover' };
    },
    handleHover: (invocation) => {
      calls.push({ method: 'handleHover', invocation });
    },
  });

  assert.deepEqual(calls, [
    { method: 'buildInvocation', nextRenderer: renderer, x: 12, y: 14 },
    { method: 'handleHover', invocation: { payload: 'hover' } },
  ]);
});

test('dispatchIsometricEntitySelection applies selection via helper', () => {
  const renderer = { id: 'renderer' };
  const entity = { id: 'entity' };
  const calls = [];

  dispatchIsometricEntitySelection(renderer, entity, {
    applySelection: (nextRenderer, nextEntity) => {
      calls.push({ method: 'applySelection', nextRenderer, nextEntity });
    },
  });

  assert.deepEqual(calls, [{ method: 'applySelection', nextRenderer: renderer, nextEntity: entity }]);
});

test('dispatchIsometricClickSelection builds invocation and dispatches click handler', () => {
  const renderer = { id: 'renderer' };
  const tile = { x: 3, z: 5 };
  const calls = [];

  dispatchIsometricClickSelection(renderer, 9, 10, tile, {
    buildInvocation: (nextRenderer, x, y, nextTile) => {
      calls.push({ method: 'buildInvocation', nextRenderer, x, y, nextTile });
      return { payload: 'click' };
    },
    handleClick: (invocation) => {
      calls.push({ method: 'handleClick', invocation });
    },
  });

  assert.deepEqual(calls, [
    { method: 'buildInvocation', nextRenderer: renderer, x: 9, y: 10, nextTile: tile },
    { method: 'handleClick', invocation: { payload: 'click' } },
  ]);
});

