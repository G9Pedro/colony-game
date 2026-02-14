import {
  screenDeltaToWorldDelta,
  screenToWorldPoint,
  worldToScreenPoint,
} from './isometricProjection.js';
import {
  computeCameraZoomStep,
} from './isometricCameraPolicies.js';
import {
  applyCameraInertia,
  clampCameraCenter,
} from './isometricCameraState.js';
import {
  dispatchIsometricCameraDragEnd,
  dispatchIsometricCameraDragMove,
  dispatchIsometricCameraDragStart,
  dispatchIsometricCameraPinchBegin,
  dispatchIsometricCameraPinchEnd,
  dispatchIsometricCameraPinchMove,
} from './isometricCameraInteractionDispatch.js';
import {
  createIsometricCameraRuntimeState,
  DEFAULT_TILE_HEIGHT,
  DEFAULT_TILE_WIDTH,
} from './isometricCameraRuntime.js';

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
    Object.assign(this, createIsometricCameraRuntimeState({
      now: performance.now(),
    }));
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
    const nextZoom = computeCameraZoomStep({
      zoom: this.zoom,
      delta,
      minZoom: this.minZoom,
      maxZoom: this.maxZoom,
    });
    this.zoom = nextZoom;
    const after = this.screenToWorld(screenX, screenY);
    this.centerX += before.x - after.x;
    this.centerZ += before.z - after.z;
    this.clampCenter();
  }

  startDrag(screenX, screenY) {
    dispatchIsometricCameraDragStart(this, {
      screenX,
      screenY,
      now: performance.now(),
    });
  }

  dragTo(screenX, screenY) {
    dispatchIsometricCameraDragMove(this, {
      screenX,
      screenY,
      now: performance.now(),
    });
  }

  endDrag() {
    return dispatchIsometricCameraDragEnd(this);
  }

  beginPinch(firstTouch, secondTouch) {
    dispatchIsometricCameraPinchBegin(this, firstTouch, secondTouch);
  }

  updatePinch(firstTouch, secondTouch) {
    dispatchIsometricCameraPinchMove(this, firstTouch, secondTouch);
  }

  endPinch() {
    dispatchIsometricCameraPinchEnd(this);
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

