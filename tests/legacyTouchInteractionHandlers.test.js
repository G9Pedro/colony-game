import test from 'node:test';
import assert from 'node:assert/strict';
import {
  handleLegacyTouchEndEvent,
  handleLegacyTouchMoveEvent,
  handleLegacyTouchStartEvent,
} from '../src/render/legacyTouchInteractionHandlers.js';

test('legacy touch start handler returns none mode for unsupported touch count', () => {
  const result = handleLegacyTouchStartEvent({
    event: { touches: [] },
    touchState: {},
    beginLegacyPinch: () => {},
    getTouchDistance: () => 0,
    toPointerLikeTouch: () => null,
    handlePointerDown: () => {},
  });
  assert.deepEqual(result, { mode: 'none' });
});

test('legacy touch move handler returns none mode for unsupported touch count', () => {
  let prevented = false;
  const result = handleLegacyTouchMoveEvent({
    event: {
      touches: [],
      preventDefault: () => {
        prevented = true;
      },
    },
    touchState: { isPinching: false },
    getTouchDistance: () => 0,
    updateRadiusFromPinch: () => 0,
    updateLegacyPinch: () => ({ radius: 0 }),
    cameraPolar: { radius: 20 },
    updateCamera: () => {},
    toPointerLikeTouch: () => null,
    handlePointerMove: () => {},
  });
  assert.equal(prevented, true);
  assert.deepEqual(result, { mode: 'none' });
});

test('legacy touch end handler forwards last pointer coordinates', () => {
  const calls = [];
  const touchState = {};
  const dragState = { lastX: 12, lastY: -8 };
  handleLegacyTouchEndEvent({
    touchState,
    endLegacyPinch: (state) => calls.push(['endPinch', state]),
    dragState,
    handlePointerUp: (event) => calls.push(['pointerUp', event]),
  });
  assert.deepEqual(calls, [
    ['endPinch', touchState],
    ['pointerUp', { clientX: 12, clientY: -8 }],
  ]);
});
