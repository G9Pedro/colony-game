import test from 'node:test';
import assert from 'node:assert/strict';
import { dispatchLegacyBuildingSync, dispatchLegacyColonistSync } from '../src/render/legacyMeshSyncDispatch.js';

function createDispatchHarness(payload = { id: 'invocation' }) {
  const calls = [];
  return {
    calls,
    buildInvocation: (renderer, state, dependencies) => {
      calls.push({ method: 'buildInvocation', renderer, state, dependencies });
      return payload;
    },
    syncMeshes: (invocation) => {
      calls.push({ method: 'syncMeshes', invocation });
    },
  };
}

test('dispatchLegacyBuildingSync builds invocation and syncs building meshes', () => {
  const harness = createDispatchHarness();
  const renderer = { id: 'renderer' };
  const state = { id: 'state' };
  const dependencies = { three: { Mesh: function Mesh() {} } };

  dispatchLegacyBuildingSync(renderer, state, {
    ...harness,
    dependencies,
  });

  assert.deepEqual(harness.calls, [
    { method: 'buildInvocation', renderer, state, dependencies },
    { method: 'syncMeshes', invocation: { id: 'invocation' } },
  ]);
});

test('dispatchLegacyColonistSync builds invocation and syncs colonist meshes', () => {
  const harness = createDispatchHarness();
  const renderer = { id: 'renderer' };
  const state = { id: 'state' };
  const dependencies = { three: { Mesh: function Mesh() {} } };

  dispatchLegacyColonistSync(renderer, state, {
    ...harness,
    dependencies,
  });

  assert.deepEqual(harness.calls, [
    { method: 'buildInvocation', renderer, state, dependencies },
    { method: 'syncMeshes', invocation: { id: 'invocation' } },
  ]);
});

