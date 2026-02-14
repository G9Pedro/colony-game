import { mapClientToLocalPoint, resolveInteractionPoint } from './interactionPointResolver.js';

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

    this.dragState = {
      active: false,
      pointerId: null,
    };
    this.touchState = {
      pinching: false,
      lastX: 0,
      lastY: 0,
    };

    this.boundPointerDown = (event) => this.handlePointerDown(event);
    this.boundPointerMove = (event) => this.handlePointerMove(event);
    this.boundPointerUp = (event) => this.handlePointerUp(event);
    this.boundPointerCancel = () => this.handlePointerCancel();
    this.boundWheel = (event) => this.handleWheel(event);
    this.boundTouchStart = (event) => this.handleTouchStart(event);
    this.boundTouchMove = (event) => this.handleTouchMove(event);
    this.boundTouchEnd = () => this.handleTouchEnd();

    this.canvas.addEventListener('pointerdown', this.boundPointerDown);
    this.canvas.addEventListener('pointermove', this.boundPointerMove);
    this.canvas.addEventListener('pointerup', this.boundPointerUp);
    this.canvas.addEventListener('pointercancel', this.boundPointerCancel);
    this.canvas.addEventListener('pointerleave', this.boundPointerCancel);
    this.canvas.addEventListener('wheel', this.boundWheel, { passive: false });
    this.canvas.addEventListener('touchstart', this.boundTouchStart, { passive: false });
    this.canvas.addEventListener('touchmove', this.boundTouchMove, { passive: false });
    this.canvas.addEventListener('touchend', this.boundTouchEnd, { passive: false });
  }

  dispose() {
    this.canvas.removeEventListener('pointerdown', this.boundPointerDown);
    this.canvas.removeEventListener('pointermove', this.boundPointerMove);
    this.canvas.removeEventListener('pointerup', this.boundPointerUp);
    this.canvas.removeEventListener('pointercancel', this.boundPointerCancel);
    this.canvas.removeEventListener('pointerleave', this.boundPointerCancel);
    this.canvas.removeEventListener('wheel', this.boundWheel);
    this.canvas.removeEventListener('touchstart', this.boundTouchStart);
    this.canvas.removeEventListener('touchmove', this.boundTouchMove);
    this.canvas.removeEventListener('touchend', this.boundTouchEnd);
  }

  handlePointerDown(event) {
    this.dragState.active = true;
    this.dragState.pointerId = event.pointerId;
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

    this.dragState.active = false;
    this.dragState.pointerId = null;
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
    this.dragState.active = false;
    this.dragState.pointerId = null;
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
      this.touchState.pinching = true;
      this.camera.endDrag();
      this.camera.beginPinch(event.touches[0], event.touches[1]);
      return;
    }

    if (event.touches.length === 1) {
      const touch = event.touches[0];
      this.touchState.lastX = touch.clientX;
      this.touchState.lastY = touch.clientY;
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
    this.touchState.lastX = touch.clientX;
    this.touchState.lastY = touch.clientY;
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
      this.touchState.pinching = false;
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

