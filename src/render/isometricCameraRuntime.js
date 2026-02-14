export const DEFAULT_TILE_WIDTH = 64;
export const DEFAULT_TILE_HEIGHT = 32;

export function createIsometricCameraRuntimeState({
  now = 0,
} = {}) {
  return {
    viewportWidth: 1,
    viewportHeight: 1,
    centerX: 0,
    centerZ: 0,
    velocityX: 0,
    velocityZ: 0,
    dragging: false,
    dragLastX: 0,
    dragLastY: 0,
    lastDragAt: now,
    dragDistance: 0,
    pinchState: {
      active: false,
      distance: 0,
      midpointX: 0,
      midpointY: 0,
    },
  };
}

