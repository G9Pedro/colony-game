export function beginLegacyPointerDrag(dragState, clientX, clientY) {
  dragState.active = true;
  dragState.moved = false;
  dragState.lastX = clientX;
  dragState.lastY = clientY;
  return dragState;
}

export function updateLegacyPointerDrag(
  dragState,
  clientX,
  clientY,
  hasPointerMovedBeyondThreshold,
  threshold = 1,
) {
  if (!dragState.active) {
    return {
      active: false,
      moved: false,
      dx: 0,
      dy: 0,
      clientX: dragState.lastX,
      clientY: dragState.lastY,
    };
  }

  const dx = clientX - dragState.lastX;
  const dy = clientY - dragState.lastY;
  if (hasPointerMovedBeyondThreshold(dx, dy, threshold)) {
    dragState.moved = true;
  }
  dragState.lastX = clientX;
  dragState.lastY = clientY;

  return {
    active: true,
    moved: dragState.moved,
    dx,
    dy,
    clientX: dragState.lastX,
    clientY: dragState.lastY,
  };
}

export function endLegacyPointerDrag(dragState) {
  if (!dragState.active) {
    return {
      active: false,
      moved: false,
      clientX: dragState.lastX,
      clientY: dragState.lastY,
    };
  }
  dragState.active = false;
  return {
    active: true,
    moved: dragState.moved,
    clientX: dragState.lastX,
    clientY: dragState.lastY,
  };
}

