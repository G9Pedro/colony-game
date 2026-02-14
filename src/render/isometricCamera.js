import {
  screenDeltaToWorldDelta,
  screenToWorldPoint,
  worldToScreenPoint,
} from './isometricProjection.js';

const DEFAULT_TILE_WIDTH = 64;
const DEFAULT_TILE_HEIGHT = 32;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

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
    const maxPan = this.worldRadius + 2;
    this.centerX = clamp(this.centerX, -maxPan, maxPan);
    this.centerZ = clamp(this.centerZ, -maxPan, maxPan);
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
    const nextZoom = clamp(this.zoom * (1 - delta), this.minZoom, this.maxZoom);
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
    this.pinchState.active = true;
    this.pinchState.distance = Math.hypot(
      secondTouch.clientX - firstTouch.clientX,
      secondTouch.clientY - firstTouch.clientY,
    );
    this.pinchState.midpointX = (firstTouch.clientX + secondTouch.clientX) * 0.5;
    this.pinchState.midpointY = (firstTouch.clientY + secondTouch.clientY) * 0.5;
    this.velocityX = 0;
    this.velocityZ = 0;
  }

  updatePinch(firstTouch, secondTouch) {
    if (!this.pinchState.active) {
      return;
    }
    const distance = Math.hypot(
      secondTouch.clientX - firstTouch.clientX,
      secondTouch.clientY - firstTouch.clientY,
    );
    if (distance <= 0) {
      return;
    }
    const midpointX = (firstTouch.clientX + secondTouch.clientX) * 0.5;
    const midpointY = (firstTouch.clientY + secondTouch.clientY) * 0.5;
    const delta = (this.pinchState.distance - distance) * 0.0022;
    this.zoomAt(delta, midpointX, midpointY);
    this.pinchState.distance = distance;
    this.pinchState.midpointX = midpointX;
    this.pinchState.midpointY = midpointY;
  }

  endPinch() {
    this.pinchState.active = false;
  }

  update(deltaSeconds) {
    if (this.dragging || this.pinchState.active) {
      return;
    }
    const dragDamping = 7.5;
    this.centerX += this.velocityX * deltaSeconds;
    this.centerZ += this.velocityZ * deltaSeconds;
    this.velocityX *= Math.max(0, 1 - dragDamping * deltaSeconds);
    this.velocityZ *= Math.max(0, 1 - dragDamping * deltaSeconds);
    if (Math.abs(this.velocityX) < 0.02) {
      this.velocityX = 0;
    }
    if (Math.abs(this.velocityZ) < 0.02) {
      this.velocityZ = 0;
    }
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

