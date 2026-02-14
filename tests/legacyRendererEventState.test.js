import test from 'node:test';
import assert from 'node:assert/strict';
import { applyLegacyRendererEventSession } from '../src/render/legacyRendererEventState.js';

test('applyLegacyRendererEventSession maps all bound handlers and unbind callback', () => {
  const renderer = {};
  const session = {
    handlers: {
      onResize: () => {},
      onPointerDown: () => {},
      onPointerMove: () => {},
      onPointerUp: () => {},
      onWheel: () => {},
      onTouchStart: () => {},
      onTouchMove: () => {},
      onTouchEnd: () => {},
    },
    unbindEvents: () => {},
  };

  applyLegacyRendererEventSession(renderer, session);

  assert.equal(renderer.boundResize, session.handlers.onResize);
  assert.equal(renderer.boundPointerDown, session.handlers.onPointerDown);
  assert.equal(renderer.boundPointerMove, session.handlers.onPointerMove);
  assert.equal(renderer.boundPointerUp, session.handlers.onPointerUp);
  assert.equal(renderer.boundWheel, session.handlers.onWheel);
  assert.equal(renderer.boundTouchStart, session.handlers.onTouchStart);
  assert.equal(renderer.boundTouchMove, session.handlers.onTouchMove);
  assert.equal(renderer.boundTouchEnd, session.handlers.onTouchEnd);
  assert.equal(renderer.unbindEvents, session.unbindEvents);
});

