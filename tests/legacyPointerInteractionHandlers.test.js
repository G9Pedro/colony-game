import test from 'node:test';
import assert from 'node:assert/strict';
import {
  handleLegacyPointerMoveEvent,
  handleLegacyWheelEvent,
} from '../src/render/legacyPointerInteractionHandlers.js';

test('legacy pointer move handler emits idle mode when drag is inactive', () => {
  const result = handleLegacyPointerMoveEvent({
    event: { clientX: 10, clientY: 20 },
    screenToGround: () => null,
    onPlacementPreview: () => {
      throw new Error('preview should not be called without ground point');
    },
    dragState: {},
    updateLegacyPointerDrag: () => ({ active: false, dx: 0, dy: 0 }),
    hasPointerMovedBeyondThreshold: () => false,
    cameraPolar: { yaw: 0, pitch: 0 },
    updateOrbitYawAndPitch: () => ({ yaw: 0, pitch: 0 }),
    updateCamera: () => {
      throw new Error('camera should not update while idle');
    },
  });
  assert.deepEqual(result, { mode: 'idle', dragUpdate: { active: false, dx: 0, dy: 0 } });
});

test('legacy wheel handler updates radius and returns latest value', () => {
  const cameraPolar = { radius: 30 };
  let prevented = false;
  const nextRadius = handleLegacyWheelEvent({
    event: {
      deltaY: 12,
      preventDefault: () => {
        prevented = true;
      },
    },
    cameraPolar,
    updateRadiusFromWheel: (radius, deltaY, factor) => {
      assert.equal(radius, 30);
      assert.equal(deltaY, 12);
      assert.equal(factor, 0.03);
      return 28;
    },
    updateCamera: () => {},
  });
  assert.equal(prevented, true);
  assert.equal(cameraPolar.radius, 28);
  assert.equal(nextRadius, 28);
});
