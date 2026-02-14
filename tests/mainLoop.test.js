import test from 'node:test';
import assert from 'node:assert/strict';
import { createMainLoopRuntimeState, runMainLoopFrame } from '../src/mainLoop.js';

test('createMainLoopRuntimeState initializes timers and last frame', () => {
  const runtime = createMainLoopRuntimeState({ now: 1234 });
  assert.deepEqual(runtime, {
    lastFrame: 1234,
    uiTimer: 0,
    autoSaveTimer: 0,
  });
});

test('runMainLoopFrame updates simulation/render and clamps delta', () => {
  const calls = [];
  const engineState = { tick: 1 };
  const runtime = createMainLoopRuntimeState({ now: 1000 });
  const engine = {
    state: engineState,
    update: (deltaSeconds) => calls.push({ method: 'update', deltaSeconds }),
    snapshot: () => ({ id: 'snapshot' }),
  };
  const renderer = {
    render: (state) => calls.push({ method: 'render', state }),
  };
  const ui = {
    render: (state) => calls.push({ method: 'uiRender', state }),
  };
  const saveSnapshotCalls = [];

  runMainLoopFrame({
    timestamp: 1200,
    runtime,
    engine,
    renderer,
    ui,
    saveSnapshot: (snapshot) => saveSnapshotCalls.push(snapshot),
  });

  assert.equal(runtime.lastFrame, 1200);
  assert.equal(calls[0].method, 'update');
  assert.equal(calls[0].deltaSeconds, 0.1);
  assert.deepEqual(calls[1], { method: 'render', state: engineState });
  assert.deepEqual(saveSnapshotCalls, []);
});

test('runMainLoopFrame triggers UI render and autosave when intervals elapse', () => {
  const runtime = createMainLoopRuntimeState({ now: 1000 });
  runtime.uiTimer = 0.18;
  runtime.autoSaveTimer = 44.95;
  const engineState = { tick: 7 };
  const calls = [];
  const engine = {
    state: engineState,
    update: () => calls.push('update'),
    snapshot: () => ({ id: 'autosave' }),
  };
  const renderer = {
    render: () => calls.push('render'),
  };
  const ui = {
    render: () => calls.push('uiRender'),
  };
  const snapshots = [];

  runMainLoopFrame({
    timestamp: 1050,
    runtime,
    engine,
    renderer,
    ui,
    saveSnapshot: (snapshot) => snapshots.push(snapshot),
  });

  assert.deepEqual(calls, ['update', 'render', 'uiRender']);
  assert.deepEqual(snapshots, [{ id: 'autosave' }]);
  assert.equal(runtime.uiTimer, 0);
  assert.equal(runtime.autoSaveTimer, 0);
});

test('runMainLoopFrame honors custom timing thresholds', () => {
  const runtime = createMainLoopRuntimeState({ now: 0 });
  const calls = [];
  const engine = {
    state: { tick: 1 },
    update: () => calls.push('update'),
    snapshot: () => ({ id: 1 }),
  };
  const renderer = {
    render: () => calls.push('render'),
  };
  const ui = {
    render: () => calls.push('uiRender'),
  };
  const snapshots = [];

  runMainLoopFrame({
    timestamp: 500,
    runtime,
    engine,
    renderer,
    ui,
    saveSnapshot: (snapshot) => snapshots.push(snapshot),
  }, {
    uiRenderIntervalSeconds: 1,
    autoSaveIntervalSeconds: 1,
  });

  assert.deepEqual(calls, ['update', 'render']);
  assert.deepEqual(snapshots, []);
});
