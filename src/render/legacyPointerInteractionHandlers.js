export function handleLegacyPointerMoveEvent({
  event,
  screenToGround,
  onPlacementPreview,
  dragState,
  updateLegacyPointerDrag,
  hasPointerMovedBeyondThreshold,
  cameraPolar,
  updateOrbitYawAndPitch,
  updateCamera,
}) {
  const point = screenToGround(event.clientX, event.clientY);
  if (point && onPlacementPreview) {
    onPlacementPreview({ x: Math.round(point.x), z: Math.round(point.z) });
  }

  const dragUpdate = updateLegacyPointerDrag(
    dragState,
    event.clientX,
    event.clientY,
    hasPointerMovedBeyondThreshold,
    1,
  );
  if (!dragUpdate.active) {
    return { mode: 'idle', dragUpdate };
  }

  const nextPolar = updateOrbitYawAndPitch(cameraPolar, dragUpdate.dx, dragUpdate.dy, 0.0055);
  cameraPolar.yaw = nextPolar.yaw;
  cameraPolar.pitch = nextPolar.pitch;
  updateCamera();
  return { mode: 'dragging', dragUpdate };
}

export function handleLegacyWheelEvent({
  event,
  cameraPolar,
  updateRadiusFromWheel,
  updateCamera,
}) {
  event.preventDefault();
  cameraPolar.radius = updateRadiusFromWheel(cameraPolar.radius, event.deltaY, 0.03);
  updateCamera();
  return cameraPolar.radius;
}
