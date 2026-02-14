import test from 'node:test';
import assert from 'node:assert/strict';
import {
  dispatchInteractionHoverPreview,
  dispatchInteractionPointerCancel,
  dispatchInteractionPointerDown,
  dispatchInteractionPointerMove,
  dispatchInteractionPointerUp,
  dispatchInteractionWheel,
  resolveInteractionControllerPoint,
} from '../src/render/interactionPointerDispatch.js';

function createPointerController() {
  const calls = [];
  return {
    calls,
    controller: {
      canvas: { id: 'canvas' },
      camera: {
        startDrag: (x, y) => calls.push(['startDrag', x, y]),
        dragTo: (x, y) => calls.push(['dragTo', x, y]),
        endDrag: () => ({ wasClick: true }),
        zoomAt: (delta, x, y) => calls.push(['zoomAt', delta, x, y]),
      },
      dragState: { active: false, pointerId: null },
      onHover: (point) => calls.push(['hover', point]),
      onPreview: (point) => calls.push(['preview', point]),
      onClick: (point) => calls.push(['click', point]),
    },
  };
}

test('resolveInteractionControllerPoint maps controller payload into resolver', () => {
  const { controller } = createPointerController();
  const point = resolveInteractionControllerPoint(controller, 10, 12, {
    resolvePoint: (payload) => {
      assert.equal(payload.camera, controller.camera);
      assert.equal(payload.canvas, controller.canvas);
      assert.equal(payload.clientX, 10);
      assert.equal(payload.clientY, 12);
      return { local: { x: 1, y: 2 } };
    },
  });
  assert.deepEqual(point, { local: { x: 1, y: 2 } });
});

test('pointer dispatch helpers coordinate hover/preview/drag/click lifecycle', () => {
  const { controller, calls } = createPointerController();

  dispatchInteractionHoverPreview(controller, { tile: { x: 1, z: 2 } });
  dispatchInteractionPointerDown(controller, { pointerId: 7, clientX: 50, clientY: 60 });
  dispatchInteractionPointerMove(controller, {
    pointerId: 7,
    clientX: 54,
    clientY: 65,
  }, {
    resolvePoint: () => ({ tile: { x: 2, z: 3 } }),
  });
  dispatchInteractionPointerUp(controller, {
    pointerId: 7,
    clientX: 54,
    clientY: 65,
  }, {
    resolvePoint: () => ({ tile: { x: 2, z: 3 } }),
  });

  assert.deepEqual(calls, [
    ['hover', { tile: { x: 1, z: 2 } }],
    ['preview', { tile: { x: 1, z: 2 } }],
    ['startDrag', 50, 60],
    ['hover', { tile: { x: 2, z: 3 } }],
    ['preview', { tile: { x: 2, z: 3 } }],
    ['dragTo', 54, 65],
    ['click', { tile: { x: 2, z: 3 } }],
  ]);
  assert.equal(controller.dragState.active, false);
  assert.equal(controller.dragState.pointerId, null);
});

test('pointer cancel and wheel dispatch clear drag and zoom around resolved point', () => {
  const { controller, calls } = createPointerController();
  let prevented = false;
  dispatchInteractionPointerDown(controller, { pointerId: 2, clientX: 1, clientY: 2 });
  dispatchInteractionPointerCancel(controller);
  dispatchInteractionWheel(controller, {
    clientX: 100,
    clientY: 120,
    deltaY: 80,
    preventDefault: () => {
      prevented = true;
    },
  }, {
    resolvePoint: () => ({ local: { x: 10, y: 12 } }),
  });
  assert.equal(prevented, true);
  assert.equal(calls.length, 2);
  assert.deepEqual(calls[0], ['startDrag', 1, 2]);
  assert.equal(calls[1][0], 'zoomAt');
  assert.ok(Math.abs(calls[1][1] - 0.096) < 0.0000001);
  assert.equal(calls[1][2], 10);
  assert.equal(calls[1][3], 12);
  assert.equal(controller.dragState.active, false);
});
