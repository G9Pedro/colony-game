import test from 'node:test';
import assert from 'node:assert/strict';
import { dispatchLegacyCameraUpdate, dispatchLegacyCenterOnBuilding } from '../src/render/legacyCameraDispatch.js';

test('dispatchLegacyCameraUpdate computes camera position and applies pose', () => {
  const renderer = {
    cameraPolar: { radius: 10, theta: 0.4, phi: 1 },
    cameraTarget: { x: 2, y: 0, z: 3 },
    camera: { id: 'camera' },
  };
  const calls = [];

  dispatchLegacyCameraUpdate(renderer, {
    computeCamera: (polar, target) => {
      calls.push({ method: 'computeCamera', polar, target });
      return { x: 1, y: 2, z: 3 };
    },
    applyCamera: (camera, target, position) => {
      calls.push({ method: 'applyCamera', camera, target, position });
    },
  });

  assert.deepEqual(calls, [
    { method: 'computeCamera', polar: renderer.cameraPolar, target: renderer.cameraTarget },
    {
      method: 'applyCamera',
      camera: renderer.camera,
      target: renderer.cameraTarget,
      position: { x: 1, y: 2, z: 3 },
    },
  ]);
});

test('dispatchLegacyCenterOnBuilding recenters camera and triggers update callback', () => {
  const renderer = {
    cameraPolar: { radius: 10, theta: 0.4, phi: 1 },
    cameraTarget: { x: 2, y: 0, z: 3 },
    camera: { id: 'camera' },
  };
  const building = { x: 6, z: 8 };
  const calls = [];

  dispatchLegacyCenterOnBuilding(renderer, building, {
    centerCamera: (nextBuilding, target, onCentered) => {
      calls.push({ method: 'centerCamera', nextBuilding, target });
      onCentered();
    },
    computeCamera: () => {
      calls.push({ method: 'computeCamera' });
      return { x: 5, y: 6, z: 7 };
    },
    applyCamera: () => {
      calls.push({ method: 'applyCamera' });
    },
  });

  assert.deepEqual(calls, [
    { method: 'centerCamera', nextBuilding: building, target: renderer.cameraTarget },
    { method: 'computeCamera' },
    { method: 'applyCamera' },
  ]);
});

