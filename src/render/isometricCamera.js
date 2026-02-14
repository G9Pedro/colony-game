import {
  screenDeltaToWorldDelta,
  screenToWorldPoint,
  worldToScreenPoint,
} from './isometricProjection.js';
import {
  applyCameraInertia,
  buildPinchGestureState,
  clampCameraCenter,
} from './isometricCameraState.js';

const DEFAULT_TILE_WIDTH = 64;
const DEFAULT_TILE_HEIGHT = 32;

export { screenToWorldPoint, worldToScreenPoint };

export class IsometricCamera {
  constructor({
    tileWidth = DEFAULT_TILE_WIDTH,
    tileHeight = DEFAULT_TILE_HEIGHT,
    zoom = 1,
    minZoom = 0.55,
    maxZoom = 2.6,
    worldRadius = 30,
  } = {}) {
    this.tileWidth = tileWidth;
    this.tileHeight = tileHeight;
    this.zoom = zoom;
    this.minZoom = minZoom;
    this.maxZoom = maxZoom;
    this.worldRadius = worldRadius;

    this.viewportWidth = 1;
    this.viewportHeight = 1;
    this.centerX = 0;
    this.centerZ = 0;
    this.velocityX = 0;
    this.velocityZ = 0;
    this.dragging = false;
    this.dragLastX = 0;
    this.dragLastY = 0;
    this.lastDragAt = performance.now();
    this.dragDistance = 0;

    this.pinchState = {
      active: false,
      distance: 0,
      midpointX: 0,
      midpointY: 0,
    };
  }

  setViewport(width, height) {
    this.viewportWidth = Math.max(1, width);
    this.viewportHeight = Math.max(1, height);
  }

  setWorldRadius(radius) {
    this.worldRadius = Math.max(4, radius);
    this.clampCenter();
  }

  clampCenter() {
    const clamped = clampCameraCenter(this.centerX, this.centerZ, {
      worldRadius: this.worldRadius,
    });
    this.centerX = clamped.centerX;
    this.centerZ = clamped.centerZ;
  }

  worldToScreen(x, z) {
    return worldToScreenPoint({
      x,
      z,
      centerX: this.centerX,
      centerZ: this.centerZ,
      width: this.viewportWidth,
      height: this.viewportHeight,
      zoom: this.zoom,
      tileWidth: this.tileWidth,
      tileHeight: this.tileHeight,
    });
  }

  screenToWorld(screenX, screenY) {
    return screenToWorldPoint({
      screenX,
      screenY,
      centerX: this.centerX,
      centerZ: this.centerZ,
      width: this.viewportWidth,
      height: this.viewportHeight,
      zoom: this.zoom,
      tileWidth: this.tileWidth,
      tileHeight: this.tileHeight,
    });
  }

  worldToTile(x, z) {
    return {
      x: Math.round(x),
      z: Math.round(z),
    };
  }

  screenToTile(screenX, screenY) {
    const world = this.screenToWorld(screenX, screenY);
    return this.worldToTile(world.x, world.z);
  }

  panByScreenDelta(deltaX, deltaY) {
    const worldDelta = screenDeltaToWorldDelta({
      deltaX,
      deltaY,
      zoom: this.zoom,
      tileWidth: this.tileWidth,
      tileHeight: this.tileHeight,
    });
    if (!worldDelta) {
      return;
    }
    this.centerX -= worldDelta.worldDeltaX;
    this.centerZ -= worldDelta.worldDeltaZ;
    this.clampCenter();
  }

  zoomAt(delta, screenX, screenY) {
    const before = this.screenToWorld(screenX, screenY);
    const nextZoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoom * (1 - delta)));
    this.zoom = nextZoom;
    const after = this.screenToWorld(screenX, screenY);
    this.centerX += before.x - after.x;
    this.centerZ += before.z - after.z;
    this.clampCenter();
  }

  startDrag(screenX, screenY) {
    this.dragging = true;
    this.dragLastX = screenX;
    this.dragLastY = screenY;
    this.lastDragAt = performance.now();
    this.dragDistance = 0;
    this.velocityX = 0;
    this.velocityZ = 0;
  }

  dragTo(screenX, screenY) {
    if (!this.dragging) {
      return;
    }
    const now = performance.now();
    const elapsed = Math.max(1, now - this.lastDragAt);
    const dx = screenX - this.dragLastX;
    const dy = screenY - this.dragLastY;
    this.dragDistance += Math.hypot(dx, dy);
    const beforeCenterX = this.centerX;
    const beforeCenterZ = this.centerZ;
    this.panByScreenDelta(dx, dy);

    const worldDelta = screenDeltaToWorldDelta({
      deltaX: dx,
      deltaY: dy,
      zoom: this.zoom,
      tileWidth: this.tileWidth,
      tileHeight: this.tileHeight,
    });
    if (!worldDelta) {
      this.velocityX = 0;
      this.velocityZ = 0;
    } else {
      this.velocityX = -worldDelta.worldDeltaX / (elapsed / 1000);
      this.velocityZ = -worldDelta.worldDeltaZ / (elapsed / 1000);
    }

    this.dragLastX = screenX;
    this.dragLastY = screenY;
    this.lastDragAt = now;
    if (Math.abs(this.centerX - beforeCenterX) < 0.0001 && Math.abs(this.centerZ - beforeCenterZ) < 0.0001) {
      this.velocityX = 0;
      this.velocityZ = 0;
    }
  }

  endDrag() {
    const wasClick = this.dragDistance < 5;
    this.dragging = false;
    return { wasClick };
  }

  beginPinch(firstTouch, secondTouch) {
    const pinchGesture = buildPinchGestureState(firstTouch, secondTouch);
    this.pinchState.active = true;
    this.pinchState.distance = pinchGesture.distance;
    this.pinchState.midpointX = pinchGesture.midpointX;
    this.pinchState.midpointY = pinchGesture.midpointY;
    this.velocityX = 0;
    this.velocityZ = 0;
  }

  updatePinch(firstTouch, secondTouch) {
    if (!this.pinchState.active) {
      return;
    }
    const pinchGesture = buildPinchGestureState(firstTouch, secondTouch);
    if (pinchGesture.distance <= 0) {
      return;
    }
    const delta = (this.pinchState.distance - pinchGesture.distance) * 0.0022;
    this.zoomAt(delta, pinchGesture.midpointX, pinchGesture.midpointY);
    this.pinchState.distance = pinchGesture.distance;
    this.pinchState.midpointX = pinchGesture.midpointX;
    this.pinchState.midpointY = pinchGesture.midpointY;
  }

  endPinch() {
    this.pinchState.active = false;
  }

  update(deltaSeconds) {
    if (this.dragging || this.pinchState.active) {
      return;
    }
    const nextState = applyCameraInertia({
      centerX: this.centerX,
      centerZ: this.centerZ,
      velocityX: this.velocityX,
      velocityZ: this.velocityZ,
      deltaSeconds,
    });
    this.centerX = nextState.centerX;
    this.centerZ = nextState.centerZ;
    this.velocityX = nextState.velocityX;
    this.velocityZ = nextState.velocityZ;
    this.clampCenter();
  }

  centerOn(worldX, worldZ) {
    this.centerX = worldX;
    this.centerZ = worldZ;
    this.velocityX = 0;
    this.velocityZ = 0;
    this.clampCenter();
  }

  getState() {
    return {
      centerX: this.centerX,
      centerZ: this.centerZ,
      zoom: this.zoom,
      tileWidth: this.tileWidth,
      tileHeight: this.tileHeight,
      width: this.viewportWidth,
      height: this.viewportHeight,
      worldRadius: this.worldRadius,
    };
  }
}

