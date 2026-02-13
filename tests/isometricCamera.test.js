import test from 'node:test';
import assert from 'node:assert/strict';
import { IsometricCamera, screenToWorldPoint, worldToScreenPoint } from '../src/render/isometricCamera.js';

test('world/screen conversion round-trips within tolerance', () => {
  const input = {
    x: 4.75,
    z: -3.2,
    centerX: 1.25,
    centerZ: -0.75,
    width: 1200,
    height: 800,
    zoom: 1.4,
    tileWidth: 64,
    tileHeight: 32,
  };
  const screen = worldToScreenPoint(input);
  const world = screenToWorldPoint({
    screenX: screen.x,
    screenY: screen.y,
    centerX: input.centerX,
    centerZ: input.centerZ,
    width: input.width,
    height: input.height,
    zoom: input.zoom,
    tileWidth: input.tileWidth,
    tileHeight: input.tileHeight,
  });

  assert.ok(Math.abs(world.x - input.x) < 0.0001);
  assert.ok(Math.abs(world.z - input.z) < 0.0001);
});

test('camera zoom and pan are clamped to configured limits', () => {
  const camera = new IsometricCamera({
    zoom: 1,
    minZoom: 0.6,
    maxZoom: 1.4,
    worldRadius: 10,
  });
  camera.setViewport(900, 700);

  camera.zoomAt(5, 450, 350);
  assert.equal(camera.zoom, 0.6);

  camera.zoomAt(-8, 450, 350);
  assert.equal(camera.zoom, 1.4);

  camera.centerOn(80, -90);
  assert.ok(camera.centerX <= 12 && camera.centerX >= -12);
  assert.ok(camera.centerZ <= 12 && camera.centerZ >= -12);
});

test('screenToTile returns rounded tile coordinates', () => {
  const camera = new IsometricCamera({ zoom: 1 });
  camera.setViewport(1000, 700);
  camera.centerOn(0, 0);

  const tileCenter = camera.worldToScreen(6, -4);
  const mapped = camera.screenToTile(tileCenter.x + 5, tileCenter.y + 4);
  assert.equal(mapped.x, 6);
  assert.equal(mapped.z, -4);
});

