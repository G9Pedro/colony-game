import {
  buildLegacyPointerMoveInvocation,
  buildLegacyPointerUpInvocation,
  buildLegacyTouchEndInvocation,
  buildLegacyTouchMoveInvocation,
  buildLegacyTouchStartInvocation,
  buildLegacyWheelInvocation,
} from './legacyInteractionInvocation.js';
import {
  handleLegacyPointerMoveEvent,
  handleLegacyTouchEndEvent,
  handleLegacyTouchMoveEvent,
  handleLegacyTouchStartEvent,
  handleLegacyWheelEvent,
} from './legacyInteractionHandlers.js';
import { handleLegacyPointerUpEvent } from './legacyPointerUpHandler.js';

export function dispatchLegacyPointerMove(renderer, event, deps = {}) {
  const buildInvocation = deps.buildInvocation ?? buildLegacyPointerMoveInvocation;
  const handleEvent = deps.handleEvent ?? handleLegacyPointerMoveEvent;
  handleEvent(buildInvocation(renderer, event));
}

export function dispatchLegacyPointerUp(renderer, event, deps = {}) {
  const buildInvocation = deps.buildInvocation ?? buildLegacyPointerUpInvocation;
  const handleEvent = deps.handleEvent ?? handleLegacyPointerUpEvent;
  handleEvent(buildInvocation(renderer, event));
}

export function dispatchLegacyWheel(renderer, event, deps = {}) {
  const buildInvocation = deps.buildInvocation ?? buildLegacyWheelInvocation;
  const handleEvent = deps.handleEvent ?? handleLegacyWheelEvent;
  handleEvent(buildInvocation(renderer, event));
}

export function dispatchLegacyTouchStart(renderer, event, deps = {}) {
  const buildInvocation = deps.buildInvocation ?? buildLegacyTouchStartInvocation;
  const handleEvent = deps.handleEvent ?? handleLegacyTouchStartEvent;
  handleEvent(buildInvocation(renderer, event));
}

export function dispatchLegacyTouchMove(renderer, event, deps = {}) {
  const buildInvocation = deps.buildInvocation ?? buildLegacyTouchMoveInvocation;
  const handleEvent = deps.handleEvent ?? handleLegacyTouchMoveEvent;
  handleEvent(buildInvocation(renderer, event));
}

export function dispatchLegacyTouchEnd(renderer, deps = {}) {
  const buildInvocation = deps.buildInvocation ?? buildLegacyTouchEndInvocation;
  const handleEvent = deps.handleEvent ?? handleLegacyTouchEndEvent;
  handleEvent(buildInvocation(renderer));
}

