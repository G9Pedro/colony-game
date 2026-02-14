import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildLegacyPointerMoveInvocation,
  buildLegacyPointerUpInvocation,
  buildLegacyTouchEndInvocation,
  buildLegacyTouchMoveInvocation,
  buildLegacyTouchStartInvocation,
  buildLegacyWheelInvocation,
} from '../src/render/legacyInteractionInvocation.js';

test('buildLegacyPointerMoveInvocation binds renderer pickers and camera update callback', () => {
  const calls = [];
  const renderer = {
    onPlacementPreview: () => {},
    dragState: { active: true },
    cameraPolar: { yaw: 1, pitch: 1, radius: 10 },
    screenToGround: (x, y) => {
      calls.push({ method: 'screenToGround', args: [x, y] });
      return { x, y };
    },
    updateCamera: () => calls.push({ method: 'updateCamera', args: [] }),
  };
  const event = { clientX: 4, clientY: 5 };

  const invocation = buildLegacyPointerMoveInvocation(renderer, event);
  assert.equal(invocation.event, event);
  assert.equal(invocation.onPlacementPreview, renderer.onPlacementPreview);
  assert.equal(invocation.dragState, renderer.dragState);
  assert.equal(invocation.cameraPolar, renderer.cameraPolar);
  assert.deepEqual(invocation.screenToGround(4, 5), { x: 4, y: 5 });
  invocation.updateCamera();

  assert.deepEqual(calls, [
    { method: 'screenToGround', args: [4, 5] },
    { method: 'updateCamera', args: [] },
  ]);
});

test('buildLegacyPointerUpInvocation binds selection and ground callbacks', () => {
  const calls = [];
  const renderer = {
    dragState: { active: false },
    onEntitySelect: () => {},
    onGroundClick: () => {},
    screenToEntity: (x, y) => {
      calls.push({ method: 'screenToEntity', args: [x, y] });
      return { id: 'entity', x, y };
    },
    screenToGround: (x, y) => {
      calls.push({ method: 'screenToGround', args: [x, y] });
      return { x, y };
    },
  };
  const event = { clientX: 1, clientY: 2 };

  const invocation = buildLegacyPointerUpInvocation(renderer, event);
  assert.equal(invocation.event, event);
  assert.equal(invocation.dragState, renderer.dragState);
  assert.equal(invocation.onEntitySelect, renderer.onEntitySelect);
  assert.equal(invocation.onGroundClick, renderer.onGroundClick);
  assert.deepEqual(invocation.screenToEntity(3, 4), { id: 'entity', x: 3, y: 4 });
  assert.deepEqual(invocation.screenToGround(5, 6), { x: 5, y: 6 });
  assert.deepEqual(calls, [
    { method: 'screenToEntity', args: [3, 4] },
    { method: 'screenToGround', args: [5, 6] },
  ]);
});

test('buildLegacyWheelInvocation exposes camera radius controls and callback', () => {
  const calls = [];
  const renderer = {
    cameraPolar: { radius: 20 },
    updateCamera: () => calls.push({ method: 'updateCamera', args: [] }),
  };
  const event = { deltaY: 10 };

  const invocation = buildLegacyWheelInvocation(renderer, event);
  assert.equal(invocation.event, event);
  assert.equal(invocation.cameraPolar, renderer.cameraPolar);
  invocation.updateCamera();
  assert.deepEqual(calls, [{ method: 'updateCamera', args: [] }]);
});

test('touch invocation builders adapt touch events into pointer callbacks', () => {
  const calls = [];
  const renderer = {
    touchState: { isPinching: false },
    dragState: { lastX: 1, lastY: 2 },
    cameraPolar: { radius: 15 },
    handlePointerDown: (pointerLikeTouch) => {
      calls.push({ method: 'handlePointerDown', args: [pointerLikeTouch] });
    },
    handlePointerMove: (pointerLikeTouch) => {
      calls.push({ method: 'handlePointerMove', args: [pointerLikeTouch] });
    },
    handlePointerUp: (pointerLikeTouch) => {
      calls.push({ method: 'handlePointerUp', args: [pointerLikeTouch] });
    },
    updateCamera: () => {
      calls.push({ method: 'updateCamera', args: [] });
    },
  };
  const event = { touches: [{ clientX: 8, clientY: 9 }] };

  const startInvocation = buildLegacyTouchStartInvocation(renderer, event);
  assert.equal(startInvocation.event, event);
  assert.equal(startInvocation.touchState, renderer.touchState);
  startInvocation.handlePointerDown({ clientX: 10, clientY: 11 });

  const moveInvocation = buildLegacyTouchMoveInvocation(renderer, event);
  assert.equal(moveInvocation.event, event);
  assert.equal(moveInvocation.touchState, renderer.touchState);
  assert.equal(moveInvocation.cameraPolar, renderer.cameraPolar);
  moveInvocation.handlePointerMove({ clientX: 12, clientY: 13 });
  moveInvocation.updateCamera();

  const endInvocation = buildLegacyTouchEndInvocation(renderer);
  assert.equal(endInvocation.touchState, renderer.touchState);
  assert.equal(endInvocation.dragState, renderer.dragState);
  endInvocation.handlePointerUp({ clientX: 14, clientY: 15 });

  assert.deepEqual(calls, [
    { method: 'handlePointerDown', args: [{ clientX: 10, clientY: 11 }] },
    { method: 'handlePointerMove', args: [{ clientX: 12, clientY: 13 }] },
    { method: 'updateCamera', args: [] },
    { method: 'handlePointerUp', args: [{ clientX: 14, clientY: 15 }] },
  ]);
});

