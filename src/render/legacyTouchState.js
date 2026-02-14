export function beginLegacyPinch(touchState, firstTouch, secondTouch, getTouchDistance) {
  touchState.isPinching = true;
  touchState.pinchDistance = getTouchDistance(firstTouch, secondTouch);
  return touchState;
}

export function endLegacyPinch(touchState) {
  touchState.isPinching = false;
  return touchState;
}

export function updateLegacyPinch(
  touchState,
  firstTouch,
  secondTouch,
  getTouchDistance,
  updateRadiusFromPinch,
  currentRadius,
  pinchFactor = 0.04,
) {
  if (!touchState.isPinching) {
    return {
      active: false,
      radius: currentRadius,
      distance: touchState.pinchDistance,
    };
  }

  const distance = getTouchDistance(firstTouch, secondTouch);
  const next = updateRadiusFromPinch(
    currentRadius,
    touchState.pinchDistance,
    distance,
    pinchFactor,
  );
  touchState.pinchDistance = next.distance;
  return {
    active: true,
    radius: next.radius,
    distance: next.distance,
  };
}

