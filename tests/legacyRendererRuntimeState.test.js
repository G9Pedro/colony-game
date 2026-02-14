import test from 'node:test';
import assert from 'node:assert/strict';
import { applyLegacyRendererRuntimeState } from '../src/render/legacyRendererRuntimeState.js';

test('applyLegacyRendererRuntimeState maps runtime primitives onto renderer instance', () => {
  const renderer = {};
  const runtime = {
    camera: { id: 'camera' },
    cameraTarget: { id: 'cameraTarget' },
    cameraPolar: { id: 'cameraPolar' },
    renderer: { id: 'renderer' },
    raycaster: { id: 'raycaster' },
    mouse: { id: 'mouse' },
    groundPlane: { id: 'groundPlane' },
    previewMarker: { id: 'previewMarker' },
    dragState: { id: 'dragState' },
    touchState: { id: 'touchState' },
    buildingMeshes: { id: 'buildingMeshes' },
    colonistMeshes: { id: 'colonistMeshes' },
  };

  applyLegacyRendererRuntimeState(renderer, runtime);

  assert.equal(renderer.camera, runtime.camera);
  assert.equal(renderer.cameraTarget, runtime.cameraTarget);
  assert.equal(renderer.cameraPolar, runtime.cameraPolar);
  assert.equal(renderer.renderer, runtime.renderer);
  assert.equal(renderer.raycaster, runtime.raycaster);
  assert.equal(renderer.mouse, runtime.mouse);
  assert.equal(renderer.groundPlane, runtime.groundPlane);
  assert.equal(renderer.previewMarker, runtime.previewMarker);
  assert.equal(renderer.dragState, runtime.dragState);
  assert.equal(renderer.touchState, runtime.touchState);
  assert.equal(renderer.buildingMeshes, runtime.buildingMeshes);
  assert.equal(renderer.colonistMeshes, runtime.colonistMeshes);
});

