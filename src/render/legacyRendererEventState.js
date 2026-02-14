export function applyLegacyRendererEventSession(renderer, session) {
  renderer.boundResize = session.handlers.onResize;
  renderer.boundPointerDown = session.handlers.onPointerDown;
  renderer.boundPointerMove = session.handlers.onPointerMove;
  renderer.boundPointerUp = session.handlers.onPointerUp;
  renderer.boundWheel = session.handlers.onWheel;
  renderer.boundTouchStart = session.handlers.onTouchStart;
  renderer.boundTouchMove = session.handlers.onTouchMove;
  renderer.boundTouchEnd = session.handlers.onTouchEnd;
  renderer.unbindEvents = session.unbindEvents;
}

