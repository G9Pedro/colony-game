export function buildLegacyEventSessionInvocation(renderer, { windowObject, bindEvents }) {
  return {
    windowObject,
    domElement: renderer.renderer.domElement,
    onResize: () => renderer.resize(),
    onPointerDown: (event) => renderer.handlePointerDown(event),
    onPointerMove: (event) => renderer.handlePointerMove(event),
    onPointerUp: (event) => renderer.handlePointerUp(event),
    onWheel: (event) => renderer.handleWheel(event),
    onTouchStart: (event) => renderer.handleTouchStart(event),
    onTouchMove: (event) => renderer.handleTouchMove(event),
    onTouchEnd: () => renderer.handleTouchEnd(),
    bindEvents,
  };
}

