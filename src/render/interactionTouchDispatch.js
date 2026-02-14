import {
  setInteractionPinching,
  updateInteractionTouchPosition,
} from './interactionControllerState.js';
import {
  dispatchInteractionHoverPreview,
  resolveInteractionControllerPoint,
} from './interactionPointerDispatch.js';

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
