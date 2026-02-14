import test from 'node:test';
import assert from 'node:assert/strict';
import { centerLegacyCameraOnBuilding, resizeLegacyRendererViewport } from '../src/render/legacyRendererViewport.js';

test('resizeLegacyRendererViewport syncs camera aspect and renderer size', () => {
  const camera = {
    aspect: 0,
    projectionUpdates: 0,
    updateProjectionMatrix() {
      this.projectionUpdates += 1;
    },
  };
  const sizeCalls = [];
  const renderer = {
    setSize: (...args) => sizeCalls.push(args),
  };
  const viewport = resizeLegacyRendererViewport(
    { clientWidth: 1280, clientHeight: 720 },
    camera,
    renderer,
  );

  assert.deepEqual(viewport, { width: 1280, height: 720 });
  assert.equal(camera.aspect, 1280 / 720);
  assert.equal(camera.projectionUpdates, 1);
  assert.deepEqual(sizeCalls, [[1280, 720, false]]);
});

test('centerLegacyCameraOnBuilding updates camera target only when building exists', () => {
  const setCalls = [];
  const cameraTarget = {
    set: (...args) => setCalls.push(args),
  };
  const updates = [];
  const moved = centerLegacyCameraOnBuilding(
    { x: 12, z: -4 },
    cameraTarget,
    () => updates.push('update'),
  );
  const ignored = centerLegacyCameraOnBuilding(
    null,
    cameraTarget,
    () => updates.push('ignored'),
  );

  assert.equal(moved, true);
  assert.equal(ignored, false);
  assert.deepEqual(setCalls, [[12, 0, -4]]);
  assert.deepEqual(updates, ['update']);
});

