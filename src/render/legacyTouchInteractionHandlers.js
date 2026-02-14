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
