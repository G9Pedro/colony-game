import { mapClientToLocalPoint } from './interactionPointResolver.js';
import {
  dispatchInteractionPointerCancel,
  dispatchInteractionPointerDown,
  dispatchInteractionPointerMove,
  dispatchInteractionPointerUp,
  dispatchInteractionTouchEnd,
  dispatchInteractionTouchMove,
  dispatchInteractionTouchStart,
  dispatchInteractionWheel,
} from './interactionControllerDispatch.js';
import {
  applyInteractionControllerEventBindings,
  bindInteractionControllerEvents,
  createInteractionControllerEventBindings,
  unbindInteractionControllerEvents,
} from './interactionControllerLifecycle.js';
import {
  createInteractionDragState,
  createInteractionTouchState,
} from './interactionControllerState.js';

export { mapClientToLocalPoint };

export class InteractionController {
  constructor({
    canvas,
    camera,
    onPreview = () => {},
    onHover = () => {},
    onClick = () => {},
  }) {
    this.canvas = canvas;
    this.camera = camera;
    this.onPreview = onPreview;
    this.onHover = onHover;
    this.onClick = onClick;

    this.dragState = createInteractionDragState();
    this.touchState = createInteractionTouchState();

    applyInteractionControllerEventBindings(this, createInteractionControllerEventBindings(this));
    bindInteractionControllerEvents(this.canvas, this);
  }

  dispose() {
    unbindInteractionControllerEvents(this.canvas, this);
  }

  handlePointerDown(event) {
    dispatchInteractionPointerDown(this, event);
  }

  handlePointerMove(event) {
    dispatchInteractionPointerMove(this, event);
  }

  handlePointerUp(event) {
    dispatchInteractionPointerUp(this, event);
  }

  handlePointerCancel() {
    dispatchInteractionPointerCancel(this);
  }

  handleWheel(event) {
    dispatchInteractionWheel(this, event);
  }

  handleTouchStart(event) {
    dispatchInteractionTouchStart(this, event);
  }

  handleTouchMove(event) {
    dispatchInteractionTouchMove(this, event);
  }

  handleTouchEnd() {
    dispatchInteractionTouchEnd(this);
  }
}

