import test from 'node:test';
import assert from 'node:assert/strict';
import { dispatchLegacyEntityPick, dispatchLegacyGroundPick } from '../src/render/legacyPickerDispatch.js';

test('dispatchLegacyGroundPick builds invocation and returns picker result', () => {
  const renderer = { id: 'renderer' };
  const calls = [];
  const result = dispatchLegacyGroundPick(renderer, 10, 20, {
    buildInvocation: (nextRenderer, clientX, clientY) => {
      calls.push({ method: 'buildInvocation', nextRenderer, clientX, clientY });
      return { payload: 'ground' };
    },
    pickAtClient: (invocation) => {
      calls.push({ method: 'pickAtClient', invocation });
      return { x: 2, z: 4 };
    },
  });

  assert.deepEqual(calls, [
    { method: 'buildInvocation', nextRenderer: renderer, clientX: 10, clientY: 20 },
    { method: 'pickAtClient', invocation: { payload: 'ground' } },
  ]);
  assert.deepEqual(result, { x: 2, z: 4 });
});

test('dispatchLegacyEntityPick builds invocation and returns picker result', () => {
  const renderer = { id: 'renderer' };
  const calls = [];
  const result = dispatchLegacyEntityPick(renderer, 30, 40, {
    buildInvocation: (nextRenderer, clientX, clientY) => {
      calls.push({ method: 'buildInvocation', nextRenderer, clientX, clientY });
      return { payload: 'entity' };
    },
    pickAtClient: (invocation) => {
      calls.push({ method: 'pickAtClient', invocation });
      return { id: 'building:hut-1' };
    },
  });

  assert.deepEqual(calls, [
    { method: 'buildInvocation', nextRenderer: renderer, clientX: 30, clientY: 40 },
    { method: 'pickAtClient', invocation: { payload: 'entity' } },
  ]);
  assert.deepEqual(result, { id: 'building:hut-1' });
});

