export function resizeLegacyRendererViewport(rootElement, camera, renderer) {
  const width = rootElement.clientWidth;
  const height = rootElement.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
  return { width, height };
}

export function centerLegacyCameraOnBuilding(building, cameraTarget, updateCamera) {
  if (!building) {
    return false;
  }
  cameraTarget.set(building.x, 0, building.z);
  updateCamera();
  return true;
}

