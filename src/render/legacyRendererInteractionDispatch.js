import { beginLegacyPointerDrag } from './legacyPointerState.js';
import {
  dispatchLegacyPointerMove,
  dispatchLegacyPointerUp,
  dispatchLegacyTouchEnd,
  dispatchLegacyTouchMove,
  dispatchLegacyTouchStart,
  dispatchLegacyWheel,
} from './legacyInteractionDispatch.js';

export function dispatchLegacyPointerDownInteraction(renderer, event, deps = {}) {
  const beginDrag = deps.beginDrag ?? beginLegacyPointerDrag;
  beginDrag(renderer.dragState, event.clientX, event.clientY);
}

export function dispatchLegacyPointerMoveInteraction(renderer, event, deps = {}) {
  const handlePointerMove = deps.handlePointerMove ?? dispatchLegacyPointerMove;
  handlePointerMove(renderer, event);
}

export function dispatchLegacyPointerUpInteraction(renderer, event, deps = {}) {
  const handlePointerUp = deps.handlePointerUp ?? dispatchLegacyPointerUp;
  handlePointerUp(renderer, event);
}

export function dispatchLegacyWheelInteraction(renderer, event, deps = {}) {
  const handleWheel = deps.handleWheel ?? dispatchLegacyWheel;
  handleWheel(renderer, event);
}

export function dispatchLegacyTouchStartInteraction(renderer, event, deps = {}) {
  const handleTouchStart = deps.handleTouchStart ?? dispatchLegacyTouchStart;
  handleTouchStart(renderer, event);
}

export function dispatchLegacyTouchMoveInteraction(renderer, event, deps = {}) {
  const handleTouchMove = deps.handleTouchMove ?? dispatchLegacyTouchMove;
  handleTouchMove(renderer, event);
}

export function dispatchLegacyTouchEndInteraction(renderer, deps = {}) {
  const handleTouchEnd = deps.handleTouchEnd ?? dispatchLegacyTouchEnd;
  handleTouchEnd(renderer);
}

