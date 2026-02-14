import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyInteractionControllerEventBindings,
  bindInteractionControllerEvents,
  createInteractionControllerEventBindings,
  unbindInteractionControllerEvents,
} from '../src/render/interactionControllerLifecycle.js';

test('createInteractionControllerEventBindings delegates to controller handlers', () => {
  const calls = [];
  const controller = {
    handlePointerDown: (event) => calls.push(['pointerdown', event]),
    handlePointerMove: (event) => calls.push(['pointermove', event]),
    handlePointerUp: (event) => calls.push(['pointerup', event]),
    handlePointerCancel: () => calls.push(['pointercancel']),
    handleWheel: (event) => calls.push(['wheel', event]),
    handleTouchStart: (event) => calls.push(['touchstart', event]),
    handleTouchMove: (event) => calls.push(['touchmove', event]),
    handleTouchEnd: () => calls.push(['touchend']),
  };

  const bindings = createInteractionControllerEventBindings(controller);
  const event = { id: 1 };

  bindings.boundPointerDown(event);
  bindings.boundPointerMove(event);
  bindings.boundPointerUp(event);
  bindings.boundPointerCancel();
  bindings.boundWheel(event);
  bindings.boundTouchStart(event);
  bindings.boundTouchMove(event);
  bindings.boundTouchEnd();

  assert.deepEqual(calls, [
    ['pointerdown', event],
    ['pointermove', event],
    ['pointerup', event],
    ['pointercancel'],
    ['wheel', event],
    ['touchstart', event],
    ['touchmove', event],
    ['touchend'],
  ]);
});

test('applyInteractionControllerEventBindings assigns generated handlers', () => {
  const controller = {};
  const bindings = {
    boundPointerDown: () => {},
    boundPointerMove: () => {},
    boundPointerUp: () => {},
    boundPointerCancel: () => {},
    boundWheel: () => {},
    boundTouchStart: () => {},
    boundTouchMove: () => {},
    boundTouchEnd: () => {},
  };

  applyInteractionControllerEventBindings(controller, bindings);
  assert.deepEqual(controller, bindings);
});

test('bind/unbind interaction controller events register expected listener set', () => {
  const addCalls = [];
  const removeCalls = [];
  const canvas = {
    addEventListener: (...args) => addCalls.push(args),
    removeEventListener: (...args) => removeCalls.push(args),
  };
  const bindings = {
    boundPointerDown: () => {},
    boundPointerMove: () => {},
    boundPointerUp: () => {},
    boundPointerCancel: () => {},
    boundWheel: () => {},
    boundTouchStart: () => {},
    boundTouchMove: () => {},
    boundTouchEnd: () => {},
  };

  bindInteractionControllerEvents(canvas, bindings);
  unbindInteractionControllerEvents(canvas, bindings);

  assert.deepEqual(addCalls, [
    ['pointerdown', bindings.boundPointerDown],
    ['pointermove', bindings.boundPointerMove],
    ['pointerup', bindings.boundPointerUp],
    ['pointercancel', bindings.boundPointerCancel],
    ['pointerleave', bindings.boundPointerCancel],
    ['wheel', bindings.boundWheel, { passive: false }],
    ['touchstart', bindings.boundTouchStart, { passive: false }],
    ['touchmove', bindings.boundTouchMove, { passive: false }],
    ['touchend', bindings.boundTouchEnd, { passive: false }],
  ]);
  assert.deepEqual(removeCalls, [
    ['pointerdown', bindings.boundPointerDown],
    ['pointermove', bindings.boundPointerMove],
    ['pointerup', bindings.boundPointerUp],
    ['pointercancel', bindings.boundPointerCancel],
    ['pointerleave', bindings.boundPointerCancel],
    ['wheel', bindings.boundWheel],
    ['touchstart', bindings.boundTouchStart],
    ['touchmove', bindings.boundTouchMove],
    ['touchend', bindings.boundTouchEnd],
  ]);
});

