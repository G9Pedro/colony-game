import test from 'node:test';
import assert from 'node:assert/strict';
import { createMainGameLoop } from '../src/mainGameLoop.js';

test('createMainGameLoop creates runtime using provided time source', () => {
  const runtime = { lastFrame: 11, uiTimer: 0, autoSaveTimer: 0 };
  const loop = createMainGameLoop({
    engine: {},
    renderer: {},
    ui: {},
    saveSnapshot: () => {},
    requestFrame: () => {},
  }, {
    nowProvider: () => 500,
    createRuntime: ({ now }) => {
      assert.equal(now, 500);
      return runtime;
    },
  });

  assert.equal(loop.runtime, runtime);
});

test('main game loop runs frame payload and reschedules itself', () => {
  const requestCalls = [];
  const frameCalls = [];
  const runtime = { id: 'runtime' };
  const engine = { id: 'engine' };
  const renderer = { id: 'renderer' };
  const ui = { id: 'ui' };
  const saveSnapshot = () => {};
  const loop = createMainGameLoop({
    engine,
    renderer,
    ui,
    saveSnapshot,
    requestFrame: (handler) => requestCalls.push(handler),
  }, {
    nowProvider: () => 100,
    createRuntime: () => runtime,
    runFrame: (payload) => frameCalls.push(payload),
  });

  loop.start();
  assert.equal(requestCalls.length, 1);
  const scheduledHandler = requestCalls[0];
  assert.equal(scheduledHandler, loop.gameLoop);

  scheduledHandler(1234);

  assert.deepEqual(frameCalls, [{
    timestamp: 1234,
    runtime,
    engine,
    renderer,
    ui,
    saveSnapshot,
  }]);
  assert.equal(requestCalls.length, 2);
  assert.equal(requestCalls[1], loop.gameLoop);
});
