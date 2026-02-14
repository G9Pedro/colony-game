import { bindLegacyRendererEvents } from './legacyRendererLifecycle.js';

export function createLegacyRendererEventSession({
  windowObject = window,
  domElement,
  onResize,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onWheel,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  bindEvents = bindLegacyRendererEvents,
}) {
  const handlers = {
    onResize: () => onResize(),
    onPointerDown: (event) => onPointerDown(event),
    onPointerMove: (event) => onPointerMove(event),
    onPointerUp: (event) => onPointerUp(event),
    onWheel: (event) => onWheel(event),
    onTouchStart: (event) => onTouchStart(event),
    onTouchMove: (event) => onTouchMove(event),
    onTouchEnd: () => onTouchEnd(),
  };

  const unbindEvents = bindEvents({
    windowObject,
    domElement,
    ...handlers,
  });

  return {
    handlers,
    unbindEvents,
  };
}

