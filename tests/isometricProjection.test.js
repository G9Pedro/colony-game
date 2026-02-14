import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getIsometricTilePixelScale,
  screenDeltaToWorldDelta,
  screenToWorldPoint,
  worldToScreenPoint,
} from '../src/render/isometricProjection.js';

test('world/screen projection helpers round-trip coordinates', () => {
  const worldPoint = {
    x: 3.25,
    z: -1.75,
    centerX: 0.5,
    centerZ: 0.25,
    width: 1400,
    height: 900,
    zoom: 1.3,
    tileWidth: 64,
    tileHeight: 32,
  };

  const screenPoint = worldToScreenPoint(worldPoint);
  const roundTrip = screenToWorldPoint({
    screenX: screenPoint.x,
    screenY: screenPoint.y,
    centerX: worldPoint.centerX,
    centerZ: worldPoint.centerZ,
    width: worldPoint.width,
    height: worldPoint.height,
    zoom: worldPoint.zoom,
    tileWidth: worldPoint.tileWidth,
    tileHeight: worldPoint.tileHeight,
  });

  assert.ok(Math.abs(roundTrip.x - worldPoint.x) < 0.0001);
  assert.ok(Math.abs(roundTrip.z - worldPoint.z) < 0.0001);
});

test('screenDeltaToWorldDelta converts drag deltas and guards invalid scale', () => {
  const worldDelta = screenDeltaToWorldDelta({
    deltaX: 32,
    deltaY: 16,
    zoom: 1,
    tileWidth: 64,
    tileHeight: 32,
  });

  assert.deepEqual(worldDelta, {
    worldDeltaX: 1,
    worldDeltaZ: 0,
  });
  assert.equal(screenDeltaToWorldDelta({
    deltaX: 32,
    deltaY: 16,
    zoom: 0,
    tileWidth: 64,
    tileHeight: 32,
  }), null);
});

test('getIsometricTilePixelScale computes half tile dimensions in pixels', () => {
  assert.deepEqual(getIsometricTilePixelScale({
    zoom: 1.5,
    tileWidth: 64,
    tileHeight: 32,
  }), {
    halfW: 48,
    halfH: 24,
  });
});

