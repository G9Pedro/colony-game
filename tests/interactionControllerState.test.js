import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clearInteractionDrag,
  createInteractionDragState,
  createInteractionTouchState,
  setInteractionPinching,
  startInteractionDrag,
  updateInteractionTouchPosition,
} from '../src/render/interactionControllerState.js';

test('createInteractionDragState returns inactive pointer state', () => {
  assert.deepEqual(createInteractionDragState(), {
    active: false,
    pointerId: null,
  });
});

test('startInteractionDrag and clearInteractionDrag mutate drag state as expected', () => {
  const dragState = createInteractionDragState();
  startInteractionDrag(dragState, 17);
  assert.deepEqual(dragState, {
    active: true,
    pointerId: 17,
  });

  clearInteractionDrag(dragState);
  assert.deepEqual(dragState, {
    active: false,
    pointerId: null,
  });
});

test('touch-state helpers update pinch and last known position', () => {
  const touchState = createInteractionTouchState();
  assert.deepEqual(touchState, {
    pinching: false,
    lastX: 0,
    lastY: 0,
  });

  setInteractionPinching(touchState, true);
  updateInteractionTouchPosition(touchState, 125, 225);
  assert.deepEqual(touchState, {
    pinching: true,
    lastX: 125,
    lastY: 225,
  });
});

