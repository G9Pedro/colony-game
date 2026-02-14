import test from 'node:test';
import assert from 'node:assert/strict';
import {
  dispatchInteractionTouchEnd,
  dispatchInteractionTouchMove,
  dispatchInteractionTouchStart,
} from '../src/render/interactionTouchDispatch.js';

function createTouchController() {
  const calls = [];
  return {
    calls,
    controller: {
      canvas: {},
      camera: {
        startDrag: (x, y) => calls.push(['startDrag', x, y]),
        dragTo: (x, y) => calls.push(['dragTo', x, y]),
        endDrag: () => ({ wasClick: true }),
        endPinch: () => calls.push(['endPinch']),
        beginPinch: (a, b) => calls.push(['beginPinch', a, b]),
        updatePinch: (a, b) => calls.push(['updatePinch', a, b]),
      },
      touchState: { pinching: false, lastX: 0, lastY: 0 },
      onHover: (point) => calls.push(['hover', point]),
      onPreview: (point) => calls.push(['preview', point]),
      onClick: (point) => calls.push(['click', point]),
    },
  };
}

test('touch dispatch handles pinch start/move/end lifecycle', () => {
  const { controller, calls } = createTouchController();
  const first = { clientX: 10, clientY: 14 };
  const second = { clientX: 20, clientY: 28 };
  dispatchInteractionTouchStart(controller, { touches: [first, second] });
  assert.equal(controller.touchState.pinching, true);

  let prevented = false;
  dispatchInteractionTouchMove(controller, {
    touches: [first, second],
    preventDefault: () => {
      prevented = true;
    },
  });
  assert.equal(prevented, true);

  dispatchInteractionTouchEnd(controller);
  assert.equal(controller.touchState.pinching, false);
  assert.deepEqual(calls, [
    ['beginPinch', first, second],
    ['updatePinch', first, second],
    ['endPinch'],
  ]);
});

test('touch dispatch handles single touch drag and click point resolution', () => {
  const { controller, calls } = createTouchController();
  const touch = { clientX: 44, clientY: 66 };
  dispatchInteractionTouchStart(controller, { touches: [touch] });
  assert.equal(controller.touchState.lastX, 44);
  assert.equal(controller.touchState.lastY, 66);

  dispatchInteractionTouchMove(controller, {
    touches: [touch],
    preventDefault: () => {},
  }, {
    resolvePoint: () => ({ tile: { x: 4, z: 6 } }),
  });
  dispatchInteractionTouchEnd(controller, {
    resolvePoint: ({ clientX, clientY }) => ({ world: { x: clientX, z: clientY } }),
  });
  assert.deepEqual(calls, [
    ['startDrag', 44, 66],
    ['dragTo', 44, 66],
    ['hover', { tile: { x: 4, z: 6 } }],
    ['preview', { tile: { x: 4, z: 6 } }],
    ['click', { world: { x: 44, z: 66 } }],
  ]);
});
