import {
  updateOrbitYawAndPitch,
  updateRadiusFromPinch,
  updateRadiusFromWheel,
} from './legacyThreeCameraControls.js';
import { getTouchDistance, hasPointerMovedBeyondThreshold, toPointerLikeTouch } from './legacyInteractionPrimitives.js';
import { updateLegacyPointerDrag } from './legacyPointerState.js';
import { beginLegacyPinch, endLegacyPinch, updateLegacyPinch } from './legacyTouchState.js';

export function buildLegacyPointerMoveInvocation(renderer, event) {
  return {
    event,
    screenToGround: (clientX, clientY) => renderer.screenToGround(clientX, clientY),
    onPlacementPreview: renderer.onPlacementPreview,
    dragState: renderer.dragState,
    updateLegacyPointerDrag,
    hasPointerMovedBeyondThreshold,
    cameraPolar: renderer.cameraPolar,
    updateOrbitYawAndPitch,
    updateCamera: () => renderer.updateCamera(),
  };
}

export function buildLegacyPointerUpInvocation(renderer, event) {
  return {
    event,
    dragState: renderer.dragState,
    onEntitySelect: renderer.onEntitySelect,
    onGroundClick: renderer.onGroundClick,
    screenToEntity: (clientX, clientY) => renderer.screenToEntity(clientX, clientY),
    screenToGround: (clientX, clientY) => renderer.screenToGround(clientX, clientY),
  };
}

export function buildLegacyWheelInvocation(renderer, event) {
  return {
    event,
    cameraPolar: renderer.cameraPolar,
    updateRadiusFromWheel,
    updateCamera: () => renderer.updateCamera(),
  };
}

export function buildLegacyTouchStartInvocation(renderer, event) {
  return {
    event,
    touchState: renderer.touchState,
    beginLegacyPinch,
    getTouchDistance,
    toPointerLikeTouch,
    handlePointerDown: (pointerLikeTouch) => renderer.handlePointerDown(pointerLikeTouch),
  };
}

export function buildLegacyTouchMoveInvocation(renderer, event) {
  return {
    event,
    touchState: renderer.touchState,
    getTouchDistance,
    updateRadiusFromPinch,
    updateLegacyPinch,
    cameraPolar: renderer.cameraPolar,
    updateCamera: () => renderer.updateCamera(),
    toPointerLikeTouch,
    handlePointerMove: (pointerLikeTouch) => renderer.handlePointerMove(pointerLikeTouch),
  };
}

export function buildLegacyTouchEndInvocation(renderer) {
  return {
    touchState: renderer.touchState,
    endLegacyPinch,
    dragState: renderer.dragState,
    handlePointerUp: (pointerLikeTouch) => renderer.handlePointerUp(pointerLikeTouch),
  };
}

