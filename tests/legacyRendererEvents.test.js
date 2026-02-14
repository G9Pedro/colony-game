import test from 'node:test';
import assert from 'node:assert/strict';
import { createLegacyRendererEventSession } from '../src/render/legacyRendererEvents.js';

test('createLegacyRendererEventSession wires handlers and delegates events', () => {
  const callLog = [];
  let boundPayload = null;
  const unbindToken = Symbol('unbind');
  const windowObject = { id: 'window' };
  const domElement = { id: 'canvas' };
  const session = createLegacyRendererEventSession({
    windowObject,
    domElement,
    onResize: () => callLog.push({ type: 'resize' }),
    onPointerDown: (event) => callLog.push({ type: 'pointerdown', event }),
    onPointerMove: (event) => callLog.push({ type: 'pointermove', event }),
    onPointerUp: (event) => callLog.push({ type: 'pointerup', event }),
    onWheel: (event) => callLog.push({ type: 'wheel', event }),
    onTouchStart: (event) => callLog.push({ type: 'touchstart', event }),
    onTouchMove: (event) => callLog.push({ type: 'touchmove', event }),
    onTouchEnd: () => callLog.push({ type: 'touchend' }),
    bindEvents: (payload) => {
      boundPayload = payload;
      return unbindToken;
    },
  });

  assert.equal(boundPayload.windowObject, windowObject);
  assert.equal(boundPayload.domElement, domElement);
  assert.equal(boundPayload.onResize, session.handlers.onResize);
  assert.equal(boundPayload.onPointerDown, session.handlers.onPointerDown);
  assert.equal(boundPayload.onTouchEnd, session.handlers.onTouchEnd);
  assert.equal(session.unbindEvents, unbindToken);

  const pointerEvent = { id: 'pointer' };
  const wheelEvent = { id: 'wheel' };
  const touchEvent = { id: 'touch' };
  session.handlers.onResize();
  session.handlers.onPointerDown(pointerEvent);
  session.handlers.onPointerMove(pointerEvent);
  session.handlers.onPointerUp(pointerEvent);
  session.handlers.onWheel(wheelEvent);
  session.handlers.onTouchStart(touchEvent);
  session.handlers.onTouchMove(touchEvent);
  session.handlers.onTouchEnd();

  assert.deepEqual(callLog, [
    { type: 'resize' },
    { type: 'pointerdown', event: pointerEvent },
    { type: 'pointermove', event: pointerEvent },
    { type: 'pointerup', event: pointerEvent },
    { type: 'wheel', event: wheelEvent },
    { type: 'touchstart', event: touchEvent },
    { type: 'touchmove', event: touchEvent },
    { type: 'touchend' },
  ]);
});

