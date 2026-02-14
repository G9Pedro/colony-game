const PASSIVE_EVENT_OPTIONS = { passive: false };

export function createInteractionControllerEventBindings(controller) {
  return {
    boundPointerDown: (event) => controller.handlePointerDown(event),
    boundPointerMove: (event) => controller.handlePointerMove(event),
    boundPointerUp: (event) => controller.handlePointerUp(event),
    boundPointerCancel: () => controller.handlePointerCancel(),
    boundWheel: (event) => controller.handleWheel(event),
    boundTouchStart: (event) => controller.handleTouchStart(event),
    boundTouchMove: (event) => controller.handleTouchMove(event),
    boundTouchEnd: () => controller.handleTouchEnd(),
  };
}

export function applyInteractionControllerEventBindings(controller, bindings) {
  Object.assign(controller, bindings);
}

export function bindInteractionControllerEvents(canvas, bindings) {
  canvas.addEventListener('pointerdown', bindings.boundPointerDown);
  canvas.addEventListener('pointermove', bindings.boundPointerMove);
  canvas.addEventListener('pointerup', bindings.boundPointerUp);
  canvas.addEventListener('pointercancel', bindings.boundPointerCancel);
  canvas.addEventListener('pointerleave', bindings.boundPointerCancel);
  canvas.addEventListener('wheel', bindings.boundWheel, PASSIVE_EVENT_OPTIONS);
  canvas.addEventListener('touchstart', bindings.boundTouchStart, PASSIVE_EVENT_OPTIONS);
  canvas.addEventListener('touchmove', bindings.boundTouchMove, PASSIVE_EVENT_OPTIONS);
  canvas.addEventListener('touchend', bindings.boundTouchEnd, PASSIVE_EVENT_OPTIONS);
}

export function unbindInteractionControllerEvents(canvas, bindings) {
  canvas.removeEventListener('pointerdown', bindings.boundPointerDown);
  canvas.removeEventListener('pointermove', bindings.boundPointerMove);
  canvas.removeEventListener('pointerup', bindings.boundPointerUp);
  canvas.removeEventListener('pointercancel', bindings.boundPointerCancel);
  canvas.removeEventListener('pointerleave', bindings.boundPointerCancel);
  canvas.removeEventListener('wheel', bindings.boundWheel);
  canvas.removeEventListener('touchstart', bindings.boundTouchStart);
  canvas.removeEventListener('touchmove', bindings.boundTouchMove);
  canvas.removeEventListener('touchend', bindings.boundTouchEnd);
}

