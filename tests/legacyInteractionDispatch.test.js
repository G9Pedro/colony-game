import test from 'node:test';
import assert from 'node:assert/strict';
import {
  dispatchLegacyPointerMove,
  dispatchLegacyPointerUp,
  dispatchLegacyTouchEnd,
  dispatchLegacyTouchMove,
  dispatchLegacyTouchStart,
  dispatchLegacyWheel,
} from '../src/render/legacyInteractionDispatch.js';

function createDispatchHarness() {
  const calls = [];
  return {
    calls,
    buildInvocation: (renderer, event) => {
      calls.push({ type: 'buildInvocation', renderer, event });
      return { renderer, event, tag: 'invocation' };
    },
    handleEvent: (invocation) => {
      calls.push({ type: 'handleEvent', invocation });
    },
  };
}

test('dispatchLegacyPointerMove builds invocation and handles event', () => {
  const harness = createDispatchHarness();
  const renderer = { id: 'renderer' };
  const event = { id: 'event' };

  dispatchLegacyPointerMove(renderer, event, harness);

  assert.deepEqual(harness.calls, [
    { type: 'buildInvocation', renderer, event },
    { type: 'handleEvent', invocation: { renderer, event, tag: 'invocation' } },
  ]);
});

test('dispatchLegacyPointerUp builds invocation and handles event', () => {
  const harness = createDispatchHarness();
  const renderer = { id: 'renderer' };
  const event = { id: 'event' };

  dispatchLegacyPointerUp(renderer, event, harness);

  assert.deepEqual(harness.calls, [
    { type: 'buildInvocation', renderer, event },
    { type: 'handleEvent', invocation: { renderer, event, tag: 'invocation' } },
  ]);
});

test('dispatchLegacyWheel builds invocation and handles event', () => {
  const harness = createDispatchHarness();
  const renderer = { id: 'renderer' };
  const event = { id: 'event' };

  dispatchLegacyWheel(renderer, event, harness);

  assert.deepEqual(harness.calls, [
    { type: 'buildInvocation', renderer, event },
    { type: 'handleEvent', invocation: { renderer, event, tag: 'invocation' } },
  ]);
});

test('dispatchLegacyTouchStart builds invocation and handles event', () => {
  const harness = createDispatchHarness();
  const renderer = { id: 'renderer' };
  const event = { id: 'event' };

  dispatchLegacyTouchStart(renderer, event, harness);

  assert.deepEqual(harness.calls, [
    { type: 'buildInvocation', renderer, event },
    { type: 'handleEvent', invocation: { renderer, event, tag: 'invocation' } },
  ]);
});

test('dispatchLegacyTouchMove builds invocation and handles event', () => {
  const harness = createDispatchHarness();
  const renderer = { id: 'renderer' };
  const event = { id: 'event' };

  dispatchLegacyTouchMove(renderer, event, harness);

  assert.deepEqual(harness.calls, [
    { type: 'buildInvocation', renderer, event },
    { type: 'handleEvent', invocation: { renderer, event, tag: 'invocation' } },
  ]);
});

test('dispatchLegacyTouchEnd builds invocation without event and handles event', () => {
  const calls = [];
  const renderer = { id: 'renderer' };

  dispatchLegacyTouchEnd(renderer, {
    buildInvocation: (nextRenderer) => {
      calls.push({ type: 'buildInvocation', renderer: nextRenderer });
      return { renderer: nextRenderer, tag: 'invocation' };
    },
    handleEvent: (invocation) => {
      calls.push({ type: 'handleEvent', invocation });
    },
  });

  assert.deepEqual(calls, [
    { type: 'buildInvocation', renderer },
    { type: 'handleEvent', invocation: { renderer, tag: 'invocation' } },
  ]);
});

