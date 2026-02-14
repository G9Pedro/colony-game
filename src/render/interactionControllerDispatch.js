import { resolveInteractionPoint } from './interactionPointResolver.js';
import {
  clearInteractionDrag,
  setInteractionPinching,
  startInteractionDrag,
  updateInteractionTouchPosition,
} from './interactionControllerState.js';

export function resolveInteractionControllerPoint(controller, clientX, clientY, deps = {}) {
  const resolvePoint = deps.resolvePoint ?? resolveInteractionPoint;
  return resolvePoint({
    camera: controller.camera,
    canvas: controller.canvas,
    clientX,
    clientY,
  });
}

export function dispatchInteractionHoverPreview(controller, point) {
  controller.onHover(point);
  controller.onPreview(point);
}

export function dispatchInteractionPointerDown(controller, event) {
  startInteractionDrag(controller.dragState, event.pointerId);
  controller.camera.startDrag(event.clientX, event.clientY);
}

export function dispatchInteractionPointerMove(controller, event, deps = {}) {
  const point = resolveInteractionControllerPoint(controller, event.clientX, event.clientY, deps);
  dispatchInteractionHoverPreview(controller, point);

  if (!controller.dragState.active || controller.dragState.pointerId !== event.pointerId) {
    return;
  }
  controller.camera.dragTo(event.clientX, event.clientY);
}

export function dispatchInteractionPointerUp(controller, event, deps = {}) {
  if (!controller.dragState.active || controller.dragState.pointerId !== event.pointerId) {
    return;
  }

  clearInteractionDrag(controller.dragState);
  const dragResult = controller.camera.endDrag();
  if (!dragResult.wasClick) {
    return;
  }

  const point = resolveInteractionControllerPoint(controller, event.clientX, event.clientY, deps);
  controller.onClick(point);
}

export function dispatchInteractionPointerCancel(controller) {
  clearInteractionDrag(controller.dragState);
  controller.camera.endDrag();
}

export function dispatchInteractionWheel(controller, event, deps = {}) {
  event.preventDefault();
  const point = resolveInteractionControllerPoint(controller, event.clientX, event.clientY, deps);
  controller.camera.zoomAt(event.deltaY * 0.0012, point.local.x, point.local.y);
}

export function dispatchInteractionTouchStart(controller, event) {
  if (event.touches.length === 2) {
    setInteractionPinching(controller.touchState, true);
    controller.camera.endDrag();
    controller.camera.beginPinch(event.touches[0], event.touches[1]);
    return;
  }

  if (event.touches.length === 1) {
    const touch = event.touches[0];
    updateInteractionTouchPosition(controller.touchState, touch.clientX, touch.clientY);
    controller.camera.startDrag(touch.clientX, touch.clientY);
  }
}

export function dispatchInteractionTouchMove(controller, event, deps = {}) {
  event.preventDefault();
  if (event.touches.length === 2 && controller.touchState.pinching) {
    controller.camera.updatePinch(event.touches[0], event.touches[1]);
    return;
  }
  if (event.touches.length !== 1) {
    return;
  }

  const touch = event.touches[0];
  updateInteractionTouchPosition(controller.touchState, touch.clientX, touch.clientY);
  controller.camera.dragTo(touch.clientX, touch.clientY);
  const point = resolveInteractionControllerPoint(controller, touch.clientX, touch.clientY, deps);
  dispatchInteractionHoverPreview(controller, point);
}

export function dispatchInteractionTouchEnd(controller, deps = {}) {
  if (controller.touchState.pinching) {
    setInteractionPinching(controller.touchState, false);
    controller.camera.endPinch();
    return;
  }

  const dragResult = controller.camera.endDrag();
  if (!dragResult.wasClick) {
    return;
  }

  const point = resolveInteractionControllerPoint(
    controller,
    controller.touchState.lastX,
    controller.touchState.lastY,
    deps,
  );
  controller.onClick(point);
}
