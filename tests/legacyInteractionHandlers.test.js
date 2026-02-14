import test from 'node:test';
import assert from 'node:assert/strict';
import {
  handleLegacyPointerMoveEvent,
  handleLegacyTouchEndEvent,
  handleLegacyTouchMoveEvent,
  handleLegacyTouchStartEvent,
  handleLegacyWheelEvent,
} from '../src/render/legacyInteractionHandlers.js';

test('handleLegacyPointerMoveEvent emits preview and updates camera during drag', () => {
  const previewCalls = [];
  const orbitCalls = [];
  const dragState = {};
  const cameraPolar = { yaw: 0, pitch: 0 };
  const result = handleLegacyPointerMoveEvent({
    event: { clientX: 12, clientY: 8 },
    screenToGround: () => ({ x: 3.4, z: -1.2 }),
    onPlacementPreview: (point) => previewCalls.push(point),
    dragState,
    updateLegacyPointerDrag: () => ({ active: true, dx: 2, dy: -1 }),
    hasPointerMovedBeyondThreshold: () => true,
    cameraPolar,
    updateOrbitYawAndPitch: (polar, dx, dy, factor) => {
      orbitCalls.push({ polar, dx, dy, factor });
      return { yaw: 4, pitch: 5 };
    },
    updateCamera: () => orbitCalls.push({ type: 'updateCamera' }),
  });

  assert.deepEqual(previewCalls, [{ x: 3, z: -1 }]);
  assert.deepEqual(orbitCalls, [
    { polar: cameraPolar, dx: 2, dy: -1, factor: 0.0055 },
    { type: 'updateCamera' },
  ]);
  assert.deepEqual(cameraPolar, { yaw: 4, pitch: 5 });
  assert.deepEqual(result, { mode: 'dragging', dragUpdate: { active: true, dx: 2, dy: -1 } });
});

test('handleLegacyWheelEvent prevents default and updates radius', () => {
  const event = {
    deltaY: 20,
    prevented: false,
    preventDefault() {
      this.prevented = true;
    },
  };
  const cameraPolar = { radius: 30 };
  const updates = [];
  const radius = handleLegacyWheelEvent({
    event,
    cameraPolar,
    updateRadiusFromWheel: (currentRadius, deltaY, factor) => {
      updates.push({ currentRadius, deltaY, factor });
      return 27;
    },
    updateCamera: () => updates.push({ type: 'updateCamera' }),
  });

  assert.equal(event.prevented, true);
  assert.equal(cameraPolar.radius, 27);
  assert.equal(radius, 27);
  assert.deepEqual(updates, [
    { currentRadius: 30, deltaY: 20, factor: 0.03 },
    { type: 'updateCamera' },
  ]);
});

test('handleLegacyTouchStartEvent handles pinch and pointer starts', () => {
  const touchState = {};
  const calls = [];
  const pinchResult = handleLegacyTouchStartEvent({
    event: { touches: [{ id: 'a' }, { id: 'b' }] },
    touchState,
    beginLegacyPinch: (state, first, second, getTouchDistance) =>
      calls.push({ state, first, second, getTouchDistance: typeof getTouchDistance }),
    getTouchDistance: () => 1,
    toPointerLikeTouch: () => null,
    handlePointerDown: () => calls.push('pointerDown'),
  });
  const pointerResult = handleLegacyTouchStartEvent({
    event: { touches: [{ id: 'only' }] },
    touchState,
    beginLegacyPinch: () => calls.push('pinch'),
    getTouchDistance: () => 1,
    toPointerLikeTouch: (touch) => ({ touch }),
    handlePointerDown: (pointerLikeTouch) => calls.push(pointerLikeTouch),
  });

  assert.equal(pinchResult.mode, 'pinch');
  assert.equal(pointerResult.mode, 'pointer');
  assert.deepEqual(calls, [
    { state: touchState, first: { id: 'a' }, second: { id: 'b' }, getTouchDistance: 'function' },
    { touch: { id: 'only' } },
  ]);
});

test('handleLegacyTouchMoveEvent handles pinch and pointer branches', () => {
  const pinchEvent = {
    touches: [{ x: 1 }, { x: 2 }],
    prevented: false,
    preventDefault() {
      this.prevented = true;
    },
  };
  const pointerEvent = {
    touches: [{ id: 'single' }],
    prevented: false,
    preventDefault() {
      this.prevented = true;
    },
  };
  const cameraPolar = { radius: 42 };
  const calls = [];
  const pinchResult = handleLegacyTouchMoveEvent({
    event: pinchEvent,
    touchState: { isPinching: true },
    getTouchDistance: () => 10,
    updateRadiusFromPinch: () => ({ radius: 39, distance: 10 }),
    updateLegacyPinch: (_touchState, first, second) => {
      calls.push({ first, second });
      return { radius: 39, distance: 10 };
    },
    cameraPolar,
    updateCamera: () => calls.push('updateCamera'),
    toPointerLikeTouch: (touch) => ({ touch }),
    handlePointerMove: () => calls.push('pointerMove'),
  });

  const pointerResult = handleLegacyTouchMoveEvent({
    event: pointerEvent,
    touchState: { isPinching: false },
    getTouchDistance: () => 0,
    updateRadiusFromPinch: () => ({ radius: 0, distance: 0 }),
    updateLegacyPinch: () => ({ radius: 0, distance: 0 }),
    cameraPolar,
    updateCamera: () => calls.push('updateCamera-2'),
    toPointerLikeTouch: (touch) => ({ mapped: touch.id }),
    handlePointerMove: (pointerLikeTouch) => calls.push(pointerLikeTouch),
  });

  assert.equal(pinchEvent.prevented, true);
  assert.equal(pointerEvent.prevented, true);
  assert.equal(cameraPolar.radius, 39);
  assert.deepEqual(pinchResult, { mode: 'pinch', pinchUpdate: { radius: 39, distance: 10 } });
  assert.deepEqual(pointerResult, { mode: 'pointer' });
  assert.deepEqual(calls, [
    { first: { x: 1 }, second: { x: 2 } },
    'updateCamera',
    { mapped: 'single' },
  ]);
});

test('handleLegacyTouchEndEvent ends pinch and forwards pointer up', () => {
  const calls = [];
  const touchState = {};
  const dragState = { lastX: 15, lastY: -6 };
  handleLegacyTouchEndEvent({
    touchState,
    endLegacyPinch: (state) => calls.push({ type: 'endPinch', state }),
    dragState,
    handlePointerUp: (event) => calls.push({ type: 'pointerUp', event }),
  });

  assert.deepEqual(calls, [
    { type: 'endPinch', state: touchState },
    { type: 'pointerUp', event: { clientX: 15, clientY: -6 } },
  ]);
});

