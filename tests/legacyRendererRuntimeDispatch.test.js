import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildLegacyRendererCameraSnapshot,
  buildLegacyRendererDebugSnapshot,
  dispatchLegacyBuildingSyncWithThree,
  dispatchLegacyColonistSyncWithThree,
  dispatchLegacyRendererDispose,
} from '../src/render/legacyRendererRuntimeDispatch.js';

test('buildLegacyRendererCameraSnapshot maps renderer camera payload', () => {
  const renderer = {
    rootElement: { id: 'root' },
    cameraTarget: { x: 1, y: 2, z: 3 },
  };
  const calls = [];
  const snapshot = { mode: 'three' };

  const result = buildLegacyRendererCameraSnapshot(renderer, {
    worldRadius: 45,
    buildCameraState: (payload) => {
      calls.push(payload);
      return snapshot;
    },
  });

  assert.equal(result, snapshot);
  assert.deepEqual(calls, [{
    rootElement: renderer.rootElement,
    cameraTarget: renderer.cameraTarget,
    worldRadius: 45,
  }]);
});

test('buildLegacyRendererDebugSnapshot maps renderer fps payload', () => {
  const renderer = { smoothedFps: 58 };
  const calls = [];
  const snapshot = { fps: 58 };

  const result = buildLegacyRendererDebugSnapshot(renderer, {
    buildDebugStats: (fps) => {
      calls.push(fps);
      return snapshot;
    },
  });

  assert.equal(result, snapshot);
  assert.deepEqual(calls, [58]);
});

test('dispatchLegacyBuildingSyncWithThree forwards three dependency payload', () => {
  const renderer = { id: 'renderer' };
  const state = { buildings: [] };
  const three = { Mesh: class {} };
  const calls = [];

  dispatchLegacyBuildingSyncWithThree(renderer, state, three, {
    syncBuildings: (target, payload, options) => {
      calls.push({ target, payload, options });
    },
  });

  assert.deepEqual(calls, [{
    target: renderer,
    payload: state,
    options: { dependencies: { three } },
  }]);
});

test('dispatchLegacyColonistSyncWithThree forwards three dependency payload', () => {
  const renderer = { id: 'renderer' };
  const state = { colonists: [] };
  const three = { Mesh: class {} };
  const calls = [];

  dispatchLegacyColonistSyncWithThree(renderer, state, three, {
    syncColonists: (target, payload, options) => {
      calls.push({ target, payload, options });
    },
  });

  assert.deepEqual(calls, [{
    target: renderer,
    payload: state,
    options: { dependencies: { three } },
  }]);
});

test('dispatchLegacyRendererDispose builds dispose payload and disposes runtime', () => {
  const renderer = { id: 'renderer' };
  const payload = { token: 'dispose' };
  const calls = [];

  dispatchLegacyRendererDispose(renderer, {
    buildDisposePayload: (target) => {
      calls.push({ type: 'build', target });
      return payload;
    },
    disposeRuntime: (runtimePayload) => {
      calls.push({ type: 'dispose', runtimePayload });
    },
  });

  assert.deepEqual(calls, [
    { type: 'build', target: renderer },
    { type: 'dispose', runtimePayload: payload },
  ]);
});

