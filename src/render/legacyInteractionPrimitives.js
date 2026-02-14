export function hasPointerMovedBeyondThreshold(dx, dy, threshold = 1) {
  return Math.abs(dx) > threshold || Math.abs(dy) > threshold;
}

export function toRoundedGroundPoint(point) {
  if (!point) {
    return null;
  }
  return {
    x: Math.round(point.x),
    z: Math.round(point.z),
  };
}

export function getTouchDistance(firstTouch, secondTouch) {
  return Math.hypot(
    secondTouch.clientX - firstTouch.clientX,
    secondTouch.clientY - firstTouch.clientY,
  );
}

export function toPointerLikeTouch(touch) {
  return {
    clientX: touch.clientX,
    clientY: touch.clientY,
  };
}

