export function applyLegacyRendererRuntimeState(renderer, runtime) {
  renderer.camera = runtime.camera;
  renderer.cameraTarget = runtime.cameraTarget;
  renderer.cameraPolar = runtime.cameraPolar;
  renderer.renderer = runtime.renderer;
  renderer.raycaster = runtime.raycaster;
  renderer.mouse = runtime.mouse;
  renderer.groundPlane = runtime.groundPlane;
  renderer.previewMarker = runtime.previewMarker;
  renderer.dragState = runtime.dragState;
  renderer.touchState = runtime.touchState;
  renderer.buildingMeshes = runtime.buildingMeshes;
  renderer.colonistMeshes = runtime.colonistMeshes;
}

