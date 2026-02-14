export function computeLegacyCameraPosition(cameraPolar, cameraTarget) {
  const { radius, yaw, pitch } = cameraPolar;
  return {
    x: Math.cos(yaw) * Math.cos(pitch) * radius + cameraTarget.x,
    y: Math.sin(pitch) * radius,
    z: Math.sin(yaw) * Math.cos(pitch) * radius + cameraTarget.z,
  };
}

export function applyLegacyCameraPose(camera, cameraTarget, position) {
  camera.position.set(position.x, position.y, position.z);
  camera.lookAt(cameraTarget);
}

