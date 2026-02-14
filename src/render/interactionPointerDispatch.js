import { resolveInteractionPoint } from './interactionPointResolver.js';
import {
  clearInteractionDrag,
  startInteractionDrag,
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
