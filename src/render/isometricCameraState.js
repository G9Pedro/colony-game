function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function clampCameraCenter(centerX, centerZ, {
  worldRadius,
  panMargin = 2,
} = {}) {
  const maxPan = worldRadius + panMargin;
  return {
    centerX: clamp(centerX, -maxPan, maxPan),
    centerZ: clamp(centerZ, -maxPan, maxPan),
  };
}

export function applyCameraInertia({
  centerX,
  centerZ,
  velocityX,
  velocityZ,
  deltaSeconds,
  dragDamping = 7.5,
  minimumVelocity = 0.02,
}) {
  const nextCenterX = centerX + velocityX * deltaSeconds;
  const nextCenterZ = centerZ + velocityZ * deltaSeconds;
  let nextVelocityX = velocityX * Math.max(0, 1 - dragDamping * deltaSeconds);
  let nextVelocityZ = velocityZ * Math.max(0, 1 - dragDamping * deltaSeconds);
  if (Math.abs(nextVelocityX) < minimumVelocity) {
    nextVelocityX = 0;
  }
  if (Math.abs(nextVelocityZ) < minimumVelocity) {
    nextVelocityZ = 0;
  }
  return {
    centerX: nextCenterX,
    centerZ: nextCenterZ,
    velocityX: nextVelocityX,
    velocityZ: nextVelocityZ,
  };
}

export function buildPinchGestureState(firstTouch, secondTouch) {
  return {
    distance: Math.hypot(
      secondTouch.clientX - firstTouch.clientX,
      secondTouch.clientY - firstTouch.clientY,
    ),
    midpointX: (firstTouch.clientX + secondTouch.clientX) * 0.5,
    midpointY: (firstTouch.clientY + secondTouch.clientY) * 0.5,
  };
}

