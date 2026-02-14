import { mapClientToLocalPoint, resolveInteractionPoint } from './interactionPointResolver.js';
import {
  applyInteractionControllerEventBindings,
  bindInteractionControllerEvents,
  createInteractionControllerEventBindings,
  unbindInteractionControllerEvents,
} from './interactionControllerLifecycle.js';
import {
  clearInteractionDrag,
  createInteractionDragState,
  createInteractionTouchState,
  setInteractionPinching,
  startInteractionDrag,
  updateInteractionTouchPosition,
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
    startInteractionDrag(this.dragState, event.pointerId);
    this.camera.startDrag(event.clientX, event.clientY);
  }

  handlePointerMove(event) {
    const point = resolveInteractionPoint({
      camera: this.camera,
      canvas: this.canvas,
      clientX: event.clientX,
      clientY: event.clientY,
    });
    this.onHover(point);
    this.onPreview(point);

    if (!this.dragState.active || this.dragState.pointerId !== event.pointerId) {
      return;
    }
    this.camera.dragTo(event.clientX, event.clientY);
  }

  handlePointerUp(event) {
    if (!this.dragState.active || this.dragState.pointerId !== event.pointerId) {
      return;
    }

    clearInteractionDrag(this.dragState);
    const dragResult = this.camera.endDrag();
    if (!dragResult.wasClick) {
      return;
    }

    const point = resolveInteractionPoint({
      camera: this.camera,
      canvas: this.canvas,
      clientX: event.clientX,
      clientY: event.clientY,
    });
    this.onClick(point);
  }

  handlePointerCancel() {
    clearInteractionDrag(this.dragState);
    this.camera.endDrag();
  }

  handleWheel(event) {
    event.preventDefault();
    const point = resolveInteractionPoint({
      camera: this.camera,
      canvas: this.canvas,
      clientX: event.clientX,
      clientY: event.clientY,
    });
    this.camera.zoomAt(event.deltaY * 0.0012, point.local.x, point.local.y);
  }

  handleTouchStart(event) {
    if (event.touches.length === 2) {
      setInteractionPinching(this.touchState, true);
      this.camera.endDrag();
      this.camera.beginPinch(event.touches[0], event.touches[1]);
      return;
    }

    if (event.touches.length === 1) {
      const touch = event.touches[0];
      updateInteractionTouchPosition(this.touchState, touch.clientX, touch.clientY);
      this.camera.startDrag(touch.clientX, touch.clientY);
    }
  }

  handleTouchMove(event) {
    event.preventDefault();
    if (event.touches.length === 2 && this.touchState.pinching) {
      this.camera.updatePinch(event.touches[0], event.touches[1]);
      return;
    }
    if (event.touches.length !== 1) {
      return;
    }
    const touch = event.touches[0];
    updateInteractionTouchPosition(this.touchState, touch.clientX, touch.clientY);
    this.camera.dragTo(touch.clientX, touch.clientY);
    const point = resolveInteractionPoint({
      camera: this.camera,
      canvas: this.canvas,
      clientX: touch.clientX,
      clientY: touch.clientY,
    });
    this.onHover(point);
    this.onPreview(point);
  }

  handleTouchEnd() {
    if (this.touchState.pinching) {
      setInteractionPinching(this.touchState, false);
      this.camera.endPinch();
      return;
    }

    const dragResult = this.camera.endDrag();
    if (!dragResult.wasClick) {
      return;
    }

    const point = resolveInteractionPoint({
      camera: this.camera,
      canvas: this.canvas,
      clientX: this.touchState.lastX,
      clientY: this.touchState.lastY,
    });
    this.onClick(point);
  }
}

