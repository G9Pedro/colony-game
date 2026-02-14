export function createInteractionDragState() {
  return {
    active: false,
    pointerId: null,
  };
}

export function createInteractionTouchState() {
  return {
    pinching: false,
    lastX: 0,
    lastY: 0,
  };
}

export function startInteractionDrag(dragState, pointerId) {
  dragState.active = true;
  dragState.pointerId = pointerId;
}

export function clearInteractionDrag(dragState) {
  dragState.active = false;
  dragState.pointerId = null;
}

export function setInteractionPinching(touchState, pinching) {
  touchState.pinching = pinching;
}

export function updateInteractionTouchPosition(touchState, clientX, clientY) {
  touchState.lastX = clientX;
  touchState.lastY = clientY;
}

