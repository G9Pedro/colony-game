import { screenToWorldPoint, worldToScreenPoint } from './isometricProjection.js';
import {
  clampCameraCenter,
} from './isometricCameraState.js';
import {
  captureIsometricCameraState,
  centerIsometricCameraOn,
  mapScreenPointToTile,
  mapWorldPointToTile,
  panIsometricCameraByScreenDelta,
  projectIsometricCameraWorldPoint,
  unprojectIsometricCameraScreenPoint,
  updateIsometricCameraInertia,
  zoomIsometricCameraAtScreenPoint,
} from './isometricCameraTransforms.js';
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
    return projectIsometricCameraWorldPoint(this, x, z);
  }

  screenToWorld(screenX, screenY) {
    return unprojectIsometricCameraScreenPoint(this, screenX, screenY);
  }

  worldToTile(x, z) {
    return mapWorldPointToTile(x, z);
  }

  screenToTile(screenX, screenY) {
    return mapScreenPointToTile(this, screenX, screenY);
  }

  panByScreenDelta(deltaX, deltaY) {
    panIsometricCameraByScreenDelta(this, deltaX, deltaY);
  }

  zoomAt(delta, screenX, screenY) {
    zoomIsometricCameraAtScreenPoint(this, {
      delta,
      screenX,
      screenY,
    });
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
    updateIsometricCameraInertia(this, deltaSeconds);
  }

  centerOn(worldX, worldZ) {
    centerIsometricCameraOn(this, worldX, worldZ);
  }

  getState() {
    return captureIsometricCameraState(this);
  }
}

