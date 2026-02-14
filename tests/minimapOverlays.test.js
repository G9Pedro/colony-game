import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildMinimapViewportCorners,
  drawMinimapCameraCenterMarker,
  drawMinimapViewportOutline,
} from '../src/ui/minimapOverlays.js';

function createOverlayContextStub() {
  const calls = [];
  return {
    calls,
    save: () => calls.push({ method: 'save' }),
    restore: () => calls.push({ method: 'restore' }),
    beginPath: () => calls.push({ method: 'beginPath' }),
    moveTo: (...args) => calls.push({ method: 'moveTo', args }),
    lineTo: (...args) => calls.push({ method: 'lineTo', args }),
    closePath: () => calls.push({ method: 'closePath' }),
    stroke: () => calls.push({ method: 'stroke' }),
    arc: (...args) => calls.push({ method: 'arc', args }),
    set strokeStyle(value) {
      calls.push({ method: 'setStrokeStyle', value });
    },
    set lineWidth(value) {
      calls.push({ method: 'setLineWidth', value });
    },
  };
}

test('buildMinimapViewportCorners maps four screen corners to world points', () => {
  const calls = [];
  const cameraState = {
    centerX: 4,
    centerZ: -3,
    width: 200,
    height: 100,
    zoom: 1.5,
    tileWidth: 64,
    tileHeight: 32,
  };

  const corners = buildMinimapViewportCorners(cameraState, {
    toWorldPoint: (payload) => {
      calls.push(payload);
      return { x: payload.screenX, z: payload.screenY };
    },
  });

  assert.equal(calls.length, 4);
  assert.deepEqual(calls.map((call) => [call.screenX, call.screenY]), [
    [0, 0],
    [200, 0],
    [200, 100],
    [0, 100],
  ]);
  assert.deepEqual(corners, [
    { x: 0, z: 0 },
    { x: 200, z: 0 },
    { x: 200, z: 100 },
    { x: 0, z: 100 },
  ]);
});

test('drawMinimapViewportOutline projects each corner and draws polygon stroke', () => {
  const ctx = createOverlayContextStub();
  const projected = [];

  drawMinimapViewportOutline(ctx, [{ x: 1, z: 2 }, { x: 3, z: 4 }, { x: 5, z: 6 }], {
    projectPoint: (point) => {
      projected.push(point);
      return { x: point.x * 10, y: point.z * 10 };
    },
  });

  assert.deepEqual(projected, [{ x: 1, z: 2 }, { x: 3, z: 4 }, { x: 5, z: 6 }]);
  assert.equal(ctx.calls.filter((call) => call.method === 'moveTo').length, 1);
  assert.equal(ctx.calls.filter((call) => call.method === 'lineTo').length, 2);
  assert.equal(ctx.calls.filter((call) => call.method === 'stroke').length, 1);
});

test('drawMinimapCameraCenterMarker draws crosshair at projected center', () => {
  const ctx = createOverlayContextStub();
  const projected = [];

  drawMinimapCameraCenterMarker(ctx, { centerX: 7, centerZ: -2 }, {
    projectPoint: (point) => {
      projected.push(point);
      return { x: 12, y: 24 };
    },
  });

  assert.deepEqual(projected, [{ x: 7, z: -2 }]);
  assert.equal(ctx.calls.filter((call) => call.method === 'arc').length, 1);
  assert.equal(ctx.calls.filter((call) => call.method === 'lineTo').length, 2);
  assert.equal(ctx.calls.filter((call) => call.method === 'stroke').length, 2);
});

