const DEFAULT_TILE_WIDTH = 64;
const DEFAULT_TILE_HEIGHT = 32;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function worldToScreenPoint({
  x,
  z,
  centerX,
  centerZ,
  width,
  height,
  zoom,
  tileWidth = DEFAULT_TILE_WIDTH,
  tileHeight = DEFAULT_TILE_HEIGHT,
}) {
  const halfW = (tileWidth * zoom) * 0.5;
  const halfH = (tileHeight * zoom) * 0.5;
  const isoX = (x - centerX) - (z - centerZ);
  const isoY = (x - centerX) + (z - centerZ);
  return {
    x: width * 0.5 + isoX * halfW,
    y: height * 0.5 + isoY * halfH,
  };
}

export function screenToWorldPoint({
  screenX,
  screenY,
  centerX,
  centerZ,
  width,
  height,
  zoom,
  tileWidth = DEFAULT_TILE_WIDTH,
  tileHeight = DEFAULT_TILE_HEIGHT,
}) {
  const halfW = (tileWidth * zoom) * 0.5;
  const halfH = (tileHeight * zoom) * 0.5;
  if (halfW <= 0 || halfH <= 0) {
    return { x: centerX, z: centerZ };
  }

  const isoX = (screenX - width * 0.5) / halfW;
  const isoY = (screenY - height * 0.5) / halfH;
  const worldDeltaX = (isoY + isoX) * 0.5;
  const worldDeltaZ = (isoY - isoX) * 0.5;
  return {
    x: centerX + worldDeltaX,
    z: centerZ + worldDeltaZ,
  };
}

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
    const halfW = (this.tileWidth * this.zoom) * 0.5;
    const halfH = (this.tileHeight * this.zoom) * 0.5;
    if (halfW <= 0 || halfH <= 0) {
      return;
    }
    const isoDeltaX = deltaX / halfW;
    const isoDeltaY = deltaY / halfH;
    const worldDeltaX = (isoDeltaY + isoDeltaX) * 0.5;
    const worldDeltaZ = (isoDeltaY - isoDeltaX) * 0.5;
    this.centerX -= worldDeltaX;
    this.centerZ -= worldDeltaZ;
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

    const halfW = (this.tileWidth * this.zoom) * 0.5;
    const halfH = (this.tileHeight * this.zoom) * 0.5;
    if (halfW > 0 && halfH > 0) {
      const isoDeltaX = dx / halfW;
      const isoDeltaY = dy / halfH;
      const worldDeltaX = (isoDeltaY + isoDeltaX) * 0.5;
      const worldDeltaZ = (isoDeltaY - isoDeltaX) * 0.5;
      this.velocityX = -worldDeltaX / (elapsed / 1000);
      this.velocityZ = -worldDeltaZ / (elapsed / 1000);
    } else {
      this.velocityX = 0;
      this.velocityZ = 0;
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

