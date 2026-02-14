import {
  computeCameraVelocityFromScreenDelta,
  didCameraCenterMove,
  isDragClick,
} from './isometricCameraPolicies.js';
import { buildPinchGestureState } from './isometricCameraState.js';

export function dispatchIsometricCameraDragStart(camera, {
  screenX,
  screenY,
  now,
}) {
  camera.dragging = true;
  camera.dragLastX = screenX;
  camera.dragLastY = screenY;
  camera.lastDragAt = now;
  camera.dragDistance = 0;
  camera.velocityX = 0;
  camera.velocityZ = 0;
}

export function dispatchIsometricCameraDragMove(
  camera,
  {
    screenX,
    screenY,
    now,
  },
  deps = {},
) {
  if (!camera.dragging) {
    return;
  }
  const computeVelocity = deps.computeVelocity ?? computeCameraVelocityFromScreenDelta;
  const didCenterMove = deps.didCenterMove ?? didCameraCenterMove;

  const elapsed = Math.max(1, now - camera.lastDragAt);
  const deltaX = screenX - camera.dragLastX;
  const deltaY = screenY - camera.dragLastY;
  camera.dragDistance += Math.hypot(deltaX, deltaY);

  const beforeCenterX = camera.centerX;
  const beforeCenterZ = camera.centerZ;
  camera.panByScreenDelta(deltaX, deltaY);

  const velocity = computeVelocity({
    deltaX,
    deltaY,
    elapsedMilliseconds: elapsed,
    zoom: camera.zoom,
    tileWidth: camera.tileWidth,
    tileHeight: camera.tileHeight,
  });
  camera.velocityX = velocity.velocityX;
  camera.velocityZ = velocity.velocityZ;
  camera.dragLastX = screenX;
  camera.dragLastY = screenY;
  camera.lastDragAt = now;

  if (!didCenterMove(
    { centerX: beforeCenterX, centerZ: beforeCenterZ },
    { centerX: camera.centerX, centerZ: camera.centerZ },
  )) {
    camera.velocityX = 0;
    camera.velocityZ = 0;
  }
}

export function dispatchIsometricCameraDragEnd(camera, deps = {}) {
  const isClick = deps.isClick ?? isDragClick;
  const wasClick = isClick(camera.dragDistance);
  camera.dragging = false;
  return { wasClick };
}

export function dispatchIsometricCameraPinchBegin(camera, firstTouch, secondTouch, deps = {}) {
  const buildPinchState = deps.buildPinchState ?? buildPinchGestureState;
  const pinchGesture = buildPinchState(firstTouch, secondTouch);
  camera.pinchState.active = true;
  camera.pinchState.distance = pinchGesture.distance;
  camera.pinchState.midpointX = pinchGesture.midpointX;
  camera.pinchState.midpointY = pinchGesture.midpointY;
  camera.velocityX = 0;
  camera.velocityZ = 0;
}

export function dispatchIsometricCameraPinchMove(camera, firstTouch, secondTouch, deps = {}) {
  if (!camera.pinchState.active) {
    return;
  }
  const buildPinchState = deps.buildPinchState ?? buildPinchGestureState;
  const pinchGesture = buildPinchState(firstTouch, secondTouch);
  if (pinchGesture.distance <= 0) {
    return;
  }
  const delta = (camera.pinchState.distance - pinchGesture.distance) * 0.0022;
  camera.zoomAt(delta, pinchGesture.midpointX, pinchGesture.midpointY);
  camera.pinchState.distance = pinchGesture.distance;
  camera.pinchState.midpointX = pinchGesture.midpointX;
  camera.pinchState.midpointY = pinchGesture.midpointY;
}

export function dispatchIsometricCameraPinchEnd(camera) {
  camera.pinchState.active = false;
}
