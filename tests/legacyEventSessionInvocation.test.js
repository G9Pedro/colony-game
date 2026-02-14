import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLegacyEventSessionInvocation } from '../src/render/legacyEventSessionInvocation.js';

function createRendererStub() {
  const calls = [];
  return {
    renderer: {
      domElement: { id: 'legacy-canvas' },
    },
    calls,
    resize: () => calls.push({ method: 'resize' }),
    handlePointerDown: (event) => calls.push({ method: 'handlePointerDown', event }),
    handlePointerMove: (event) => calls.push({ method: 'handlePointerMove', event }),
    handlePointerUp: (event) => calls.push({ method: 'handlePointerUp', event }),
    handleWheel: (event) => calls.push({ method: 'handleWheel', event }),
    handleTouchStart: (event) => calls.push({ method: 'handleTouchStart', event }),
    handleTouchMove: (event) => calls.push({ method: 'handleTouchMove', event }),
    handleTouchEnd: () => calls.push({ method: 'handleTouchEnd' }),
  };
}

test('buildLegacyEventSessionInvocation maps renderer dependencies and callbacks', () => {
  const renderer = createRendererStub();
  const windowObject = { addEventListener() {} };
  const bindEvents = () => {};

  const invocation = buildLegacyEventSessionInvocation(renderer, { windowObject, bindEvents });

  assert.equal(invocation.windowObject, windowObject);
  assert.equal(invocation.domElement, renderer.renderer.domElement);
  assert.equal(invocation.bindEvents, bindEvents);
});

test('buildLegacyEventSessionInvocation callback delegates invoke renderer handlers', () => {
  const renderer = createRendererStub();
  const invocation = buildLegacyEventSessionInvocation(renderer, {
    windowObject: {},
    bindEvents: () => {},
  });
  const pointerDown = { id: 'down' };
  const pointerMove = { id: 'move' };
  const pointerUp = { id: 'up' };
  const wheel = { id: 'wheel' };
  const touchStart = { id: 'touch-start' };
  const touchMove = { id: 'touch-move' };

  invocation.onResize();
  invocation.onPointerDown(pointerDown);
  invocation.onPointerMove(pointerMove);
  invocation.onPointerUp(pointerUp);
  invocation.onWheel(wheel);
  invocation.onTouchStart(touchStart);
  invocation.onTouchMove(touchMove);
  invocation.onTouchEnd();

  assert.deepEqual(renderer.calls, [
    { method: 'resize' },
    { method: 'handlePointerDown', event: pointerDown },
    { method: 'handlePointerMove', event: pointerMove },
    { method: 'handlePointerUp', event: pointerUp },
    { method: 'handleWheel', event: wheel },
    { method: 'handleTouchStart', event: touchStart },
    { method: 'handleTouchMove', event: touchMove },
    { method: 'handleTouchEnd' },
  ]);
});

