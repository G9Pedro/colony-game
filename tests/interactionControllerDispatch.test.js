import test from 'node:test';
import assert from 'node:assert/strict';
import {
  dispatchInteractionPointerMove,
  dispatchInteractionPointerUp,
  dispatchInteractionTouchEnd,
  dispatchInteractionTouchMove,
  dispatchInteractionTouchStart,
  dispatchInteractionWheel,
  resolveInteractionControllerPoint,
} from '../src/render/interactionControllerDispatch.js';

function createControllerFixture() {
  const calls = [];
  const controller = {
    canvas: { id: 'canvas' },
    camera: {
      dragTo: (x, y) => calls.push(['dragTo', x, y]),
      endDrag: () => ({ wasClick: true }),
      endPinch: () => calls.push(['endPinch']),
      beginPinch: (a, b) => calls.push(['beginPinch', a, b]),
      startDrag: (x, y) => calls.push(['startDrag', x, y]),
      updatePinch: (a, b) => calls.push(['updatePinch', a, b]),
      zoomAt: (delta, x, y) => calls.push(['zoomAt', delta, x, y]),
    },
    dragState: { active: false, pointerId: null },
    touchState: { pinching: false, lastX: 0, lastY: 0 },
    onHover: (point) => calls.push(['hover', point]),
    onPreview: (point) => calls.push(['preview', point]),
    onClick: (point) => calls.push(['click', point]),
  };
  return { controller, calls };
}

test('resolveInteractionControllerPoint maps controller dependencies into resolver payload', () => {
  const { controller } = createControllerFixture();
  const point = resolveInteractionControllerPoint(controller, 34, 55, {
    resolvePoint: (payload) => {
      assert.equal(payload.camera, controller.camera);
      assert.equal(payload.canvas, controller.canvas);
      assert.equal(payload.clientX, 34);
      assert.equal(payload.clientY, 55);
      return { local: { x: 1, y: 2 } };
    },
  });
  assert.deepEqual(point, { local: { x: 1, y: 2 } });
});

test('dispatchInteractionPointerMove emits hover/preview and drags only active pointer', () => {
  const { controller, calls } = createControllerFixture();
  controller.dragState.active = true;
  controller.dragState.pointerId = 5;

  dispatchInteractionPointerMove(controller, {
    pointerId: 5,
    clientX: 120,
    clientY: 140,
  }, {
    resolvePoint: () => ({ local: { x: 12, y: 14 }, tile: { x: 1, z: 2 } }),
  });
  dispatchInteractionPointerMove(controller, {
    pointerId: 9,
    clientX: 300,
    clientY: 330,
  }, {
    resolvePoint: () => ({ local: { x: 30, y: 33 }, tile: { x: 3, z: 4 } }),
  });

  assert.deepEqual(calls, [
    ['hover', { local: { x: 12, y: 14 }, tile: { x: 1, z: 2 } }],
    ['preview', { local: { x: 12, y: 14 }, tile: { x: 1, z: 2 } }],
    ['dragTo', 120, 140],
    ['hover', { local: { x: 30, y: 33 }, tile: { x: 3, z: 4 } }],
    ['preview', { local: { x: 30, y: 33 }, tile: { x: 3, z: 4 } }],
  ]);
});

test('dispatchInteractionPointerUp clears drag and triggers click only for click drags', () => {
  const { controller, calls } = createControllerFixture();
  controller.dragState.active = true;
  controller.dragState.pointerId = 4;
  controller.camera.endDrag = () => ({ wasClick: false });

  dispatchInteractionPointerUp(controller, {
    pointerId: 4,
    clientX: 20,
    clientY: 30,
  }, {
    resolvePoint: () => ({ tile: { x: 2, z: 3 } }),
  });
  assert.equal(controller.dragState.active, false);
  assert.equal(controller.dragState.pointerId, null);
  assert.equal(calls.length, 0);

  controller.dragState.active = true;
  controller.dragState.pointerId = 7;
  controller.camera.endDrag = () => ({ wasClick: true });
  dispatchInteractionPointerUp(controller, {
    pointerId: 7,
    clientX: 50,
    clientY: 60,
  }, {
    resolvePoint: () => ({ tile: { x: 5, z: 6 } }),
  });
  assert.deepEqual(calls, [['click', { tile: { x: 5, z: 6 } }]]);
});

test('dispatchInteractionWheel prevents default and zooms around resolved local point', () => {
  const { controller, calls } = createControllerFixture();
  let prevented = false;
  dispatchInteractionWheel(controller, {
    clientX: 200,
    clientY: 150,
    deltaY: 90,
    preventDefault: () => {
      prevented = true;
    },
  }, {
    resolvePoint: () => ({ local: { x: 15, y: 18 } }),
  });
  assert.equal(prevented, true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], 'zoomAt');
  assert.ok(Math.abs(calls[0][1] - 0.108) < 0.0000001);
  assert.equal(calls[0][2], 15);
  assert.equal(calls[0][3], 18);
});

test('touch dispatch handles pinch begin/move/end lifecycle', () => {
  const { controller, calls } = createControllerFixture();
  const first = { clientX: 10, clientY: 12 };
  const second = { clientX: 18, clientY: 21 };
  dispatchInteractionTouchStart(controller, { touches: [first, second] });
  assert.equal(controller.touchState.pinching, true);
  assert.deepEqual(calls, [
    ['beginPinch', first, second],
  ]);

  let prevented = false;
  dispatchInteractionTouchMove(controller, {
    touches: [first, second],
    preventDefault: () => {
      prevented = true;
    },
  });
  assert.equal(prevented, true);
  assert.deepEqual(calls, [
    ['beginPinch', first, second],
    ['updatePinch', first, second],
  ]);

  dispatchInteractionTouchEnd(controller);
  assert.equal(controller.touchState.pinching, false);
  assert.deepEqual(calls, [
    ['beginPinch', first, second],
    ['updatePinch', first, second],
    ['endPinch'],
  ]);
});

test('touch drag move updates position and touch end click uses last touch coordinates', () => {
  const { controller, calls } = createControllerFixture();
  const touch = { clientX: 44, clientY: 66 };
  let prevented = false;
  dispatchInteractionTouchMove(controller, {
    touches: [touch],
    preventDefault: () => {
      prevented = true;
    },
  }, {
    resolvePoint: () => ({ tile: { x: 9, z: 11 } }),
  });
  assert.equal(prevented, true);
  assert.equal(controller.touchState.lastX, 44);
  assert.equal(controller.touchState.lastY, 66);
  assert.deepEqual(calls, [
    ['dragTo', 44, 66],
    ['hover', { tile: { x: 9, z: 11 } }],
    ['preview', { tile: { x: 9, z: 11 } }],
  ]);

  dispatchInteractionTouchEnd(controller, {
    resolvePoint: ({ clientX, clientY }) => ({ world: { x: clientX / 10, z: clientY / 10 } }),
  });
  assert.deepEqual(calls, [
    ['dragTo', 44, 66],
    ['hover', { tile: { x: 9, z: 11 } }],
    ['preview', { tile: { x: 9, z: 11 } }],
    ['click', { world: { x: 4.4, z: 6.6 } }],
  ]);
});
