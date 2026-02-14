import test from 'node:test';
import assert from 'node:assert/strict';
import {
  dispatchLegacyPointerDownInteraction,
  dispatchLegacyPointerMoveInteraction,
  dispatchLegacyPointerUpInteraction,
  dispatchLegacyTouchEndInteraction,
  dispatchLegacyTouchMoveInteraction,
  dispatchLegacyTouchStartInteraction,
  dispatchLegacyWheelInteraction,
} from '../src/render/legacyRendererInteractionDispatch.js';

function createRendererStub() {
  return {
    dragState: { active: false },
  };
}

test('dispatchLegacyPointerDownInteraction starts drag state with event coordinates', () => {
  const renderer = createRendererStub();
  const event = { clientX: 12, clientY: 14 };
  const calls = [];

  dispatchLegacyPointerDownInteraction(renderer, event, {
    beginDrag: (dragState, clientX, clientY) => calls.push({ dragState, clientX, clientY }),
  });

  assert.deepEqual(calls, [{ dragState: renderer.dragState, clientX: 12, clientY: 14 }]);
});

test('legacy renderer interaction dispatch forwards pointer and wheel events', () => {
  const renderer = createRendererStub();
  const pointerEvent = { type: 'pointermove' };
  const wheelEvent = { type: 'wheel' };
  const calls = [];

  dispatchLegacyPointerMoveInteraction(renderer, pointerEvent, {
    handlePointerMove: (target, event) => calls.push({ method: 'pointerMove', target, event }),
  });
  dispatchLegacyPointerUpInteraction(renderer, pointerEvent, {
    handlePointerUp: (target, event) => calls.push({ method: 'pointerUp', target, event }),
  });
  dispatchLegacyWheelInteraction(renderer, wheelEvent, {
    handleWheel: (target, event) => calls.push({ method: 'wheel', target, event }),
  });

  assert.deepEqual(calls, [
    { method: 'pointerMove', target: renderer, event: pointerEvent },
    { method: 'pointerUp', target: renderer, event: pointerEvent },
    { method: 'wheel', target: renderer, event: wheelEvent },
  ]);
});

test('legacy renderer interaction dispatch forwards touch interactions', () => {
  const renderer = createRendererStub();
  const touchEvent = { touches: [] };
  const calls = [];

  dispatchLegacyTouchStartInteraction(renderer, touchEvent, {
    handleTouchStart: (target, event) => calls.push({ method: 'touchStart', target, event }),
  });
  dispatchLegacyTouchMoveInteraction(renderer, touchEvent, {
    handleTouchMove: (target, event) => calls.push({ method: 'touchMove', target, event }),
  });
  dispatchLegacyTouchEndInteraction(renderer, {
    handleTouchEnd: (target) => calls.push({ method: 'touchEnd', target }),
  });

  assert.deepEqual(calls, [
    { method: 'touchStart', target: renderer, event: touchEvent },
    { method: 'touchMove', target: renderer, event: touchEvent },
    { method: 'touchEnd', target: renderer },
  ]);
});

