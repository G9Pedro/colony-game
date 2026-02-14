import test from 'node:test';
import assert from 'node:assert/strict';
import { applyLegacyCameraPose, computeLegacyCameraPosition } from '../src/render/legacyCameraPose.js';

test('computeLegacyCameraPosition projects polar camera around target', () => {
  const position = computeLegacyCameraPosition(
    { radius: 10, yaw: Math.PI / 2, pitch: 0 },
    { x: 3, z: -4 },
  );

  assert.ok(Math.abs(position.x - 3) < 1e-9);
  assert.ok(Math.abs(position.y - 0) < 1e-9);
  assert.ok(Math.abs(position.z - 6) < 1e-9);
});

test('applyLegacyCameraPose assigns position and look target', () => {
  const calls = [];
  const camera = {
    position: {
      set: (x, y, z) => calls.push({ type: 'set', x, y, z }),
    },
    lookAt: (target) => calls.push({ type: 'lookAt', target }),
  };
  const cameraTarget = { x: 2, y: 0, z: 5 };

  applyLegacyCameraPose(camera, cameraTarget, { x: 8, y: 4, z: -1 });

  assert.deepEqual(calls, [
    { type: 'set', x: 8, y: 4, z: -1 },
    { type: 'lookAt', target: cameraTarget },
  ]);
});

