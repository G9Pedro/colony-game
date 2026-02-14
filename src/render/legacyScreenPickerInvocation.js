export function buildLegacyGroundPickerInvocation(renderer, clientX, clientY) {
  return {
    clientX,
    clientY,
    domElement: renderer.renderer.domElement,
    mouse: renderer.mouse,
    raycaster: renderer.raycaster,
    camera: renderer.camera,
    groundPlane: renderer.groundPlane,
  };
}

export function buildLegacyEntityPickerInvocation(renderer, clientX, clientY) {
  return {
    clientX,
    clientY,
    domElement: renderer.renderer.domElement,
    mouse: renderer.mouse,
    raycaster: renderer.raycaster,
    camera: renderer.camera,
    buildingMeshes: renderer.buildingMeshes,
    colonistMeshes: renderer.colonistMeshes,
  };
}

