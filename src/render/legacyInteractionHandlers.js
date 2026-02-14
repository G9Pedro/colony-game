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

export function handleLegacyTouchStartEvent({
  event,
  touchState,
  beginLegacyPinch,
  getTouchDistance,
  toPointerLikeTouch,
  handlePointerDown,
}) {
  if (event.touches.length === 2) {
    const [first, second] = event.touches;
    beginLegacyPinch(touchState, first, second, getTouchDistance);
    return { mode: 'pinch' };
  }

  if (event.touches.length === 1) {
    handlePointerDown(toPointerLikeTouch(event.touches[0]));
    return { mode: 'pointer' };
  }

  return { mode: 'none' };
}

export function handleLegacyTouchMoveEvent({
  event,
  touchState,
  getTouchDistance,
  updateRadiusFromPinch,
  updateLegacyPinch,
  cameraPolar,
  updateCamera,
  toPointerLikeTouch,
  handlePointerMove,
}) {
  event.preventDefault();
  if (event.touches.length === 2 && touchState.isPinching) {
    const [first, second] = event.touches;
    const pinchUpdate = updateLegacyPinch(
      touchState,
      first,
      second,
      getTouchDistance,
      updateRadiusFromPinch,
      cameraPolar.radius,
      0.04,
    );
    cameraPolar.radius = pinchUpdate.radius;
    updateCamera();
    return { mode: 'pinch', pinchUpdate };
  }

  if (event.touches.length === 1) {
    handlePointerMove(toPointerLikeTouch(event.touches[0]));
    return { mode: 'pointer' };
  }

  return { mode: 'none' };
}

export function handleLegacyTouchEndEvent({
  touchState,
  endLegacyPinch,
  dragState,
  handlePointerUp,
}) {
  endLegacyPinch(touchState);
  handlePointerUp({
    clientX: dragState.lastX,
    clientY: dragState.lastY,
  });
}

