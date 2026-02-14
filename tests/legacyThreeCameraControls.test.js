import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clampThreeCameraPitch,
  clampThreeCameraRadius,
  updateOrbitYawAndPitch,
  updateRadiusFromPinch,
  updateRadiusFromWheel,
} from '../src/render/legacyThreeCameraControls.js';

test('camera control helpers clamp radius and pitch bounds', () => {
  assert.equal(clampThreeCameraRadius(5), 16);
  assert.equal(clampThreeCameraRadius(70), 68);
  assert.equal(clampThreeCameraPitch(0.1), 0.25);
  assert.equal(clampThreeCameraPitch(2), 1.25);
});

test('updateOrbitYawAndPitch applies drag deltas and pitch clamp', () => {
  const next = updateOrbitYawAndPitch({ yaw: 1, pitch: 0.3 }, 100, -200, 0.0055);
  assert.ok(next.yaw < 1);
  assert.equal(next.pitch, 0.25);
});

test('wheel and pinch radius updates preserve clamped bounds', () => {
  assert.equal(updateRadiusFromWheel(20, -1000, 0.03), 16);
  assert.equal(updateRadiusFromWheel(20, 3000, 0.03), 68);

  const pinch = updateRadiusFromPinch(42, 120, 100, 0.04);
  assert.equal(pinch.distance, 100);
  assert.ok(pinch.radius > 42);
});

