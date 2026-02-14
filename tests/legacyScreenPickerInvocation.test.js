import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildLegacyEntityPickerInvocation,
  buildLegacyGroundPickerInvocation,
} from '../src/render/legacyScreenPickerInvocation.js';

test('buildLegacyGroundPickerInvocation maps renderer ground picking dependencies', () => {
  const renderer = {
    renderer: { domElement: { id: 'canvas' } },
    mouse: { id: 'mouse' },
    raycaster: { id: 'raycaster' },
    camera: { id: 'camera' },
    groundPlane: { id: 'groundPlane' },
  };

  assert.deepEqual(buildLegacyGroundPickerInvocation(renderer, 12, 33), {
    clientX: 12,
    clientY: 33,
    domElement: renderer.renderer.domElement,
    mouse: renderer.mouse,
    raycaster: renderer.raycaster,
    camera: renderer.camera,
    groundPlane: renderer.groundPlane,
  });
});

test('buildLegacyEntityPickerInvocation maps renderer entity picking dependencies', () => {
  const renderer = {
    renderer: { domElement: { id: 'canvas' } },
    mouse: { id: 'mouse' },
    raycaster: { id: 'raycaster' },
    camera: { id: 'camera' },
    buildingMeshes: { id: 'buildingMeshes' },
    colonistMeshes: { id: 'colonistMeshes' },
  };

  assert.deepEqual(buildLegacyEntityPickerInvocation(renderer, 4, 8), {
    clientX: 4,
    clientY: 8,
    domElement: renderer.renderer.domElement,
    mouse: renderer.mouse,
    raycaster: renderer.raycaster,
    camera: renderer.camera,
    buildingMeshes: renderer.buildingMeshes,
    colonistMeshes: renderer.colonistMeshes,
  });
});

