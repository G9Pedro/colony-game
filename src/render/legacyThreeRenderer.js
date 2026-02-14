import * as THREE from '../../node_modules/three/build/three.module.js';
import { dispatchLegacyCameraUpdate } from './legacyCameraDispatch.js';
import {
  dispatchLegacyPointerMove,
  dispatchLegacyPointerUp,
  dispatchLegacyTouchEnd,
  dispatchLegacyTouchMove,
  dispatchLegacyTouchStart,
  dispatchLegacyWheel,
} from './legacyInteractionDispatch.js';
import { disposeLegacyRendererRuntime } from './legacyRendererLifecycle.js';
import { beginLegacyPointerDrag } from './legacyPointerState.js';
import { dispatchLegacyFrame } from './legacyFrameDispatch.js';
import { dispatchLegacyBuildingSync, dispatchLegacyColonistSync } from './legacyMeshSyncDispatch.js';
import { buildLegacyCameraState, buildLegacyDebugStats } from './legacyRendererSnapshots.js';
import { buildLegacyDisposeInvocation } from './legacyDisposeInvocation.js';
import {
  applyRendererEntitySelectHandler,
  applyRendererGroundClickHandler,
  applyRendererPlacementPreviewHandler,
} from './rendererCallbackState.js';
import { initializeLegacyThreeRenderer } from './legacyRendererInitialization.js';
import { dispatchLegacyEventSessionBind } from './legacyEventSessionDispatch.js';
import {
  dispatchLegacyCameraCenter,
  dispatchLegacyEntityPickAtScreen,
  dispatchLegacyGroundPickAtScreen,
  dispatchLegacyPlacementMarker,
  dispatchLegacyPreviewClear,
  dispatchLegacyPreviewSet,
  dispatchLegacyViewportResize,
} from './legacyRendererSurfaceDispatch.js';

export class LegacyThreeRenderer {
  constructor(rootElement) {
    initializeLegacyThreeRenderer(this, {
      rootElement,
      three: THREE,
      performanceObject: performance,
      windowObject: window,
      maxPixelRatio: 2,
    });
  }

  bindEvents() {
    dispatchLegacyEventSessionBind(this);
  }

  updateCamera() {
    dispatchLegacyCameraUpdate(this);
  }

  resize() {
    dispatchLegacyViewportResize(this);
  }

  setGroundClickHandler(handler) {
    applyRendererGroundClickHandler(this, handler);
  }

  setPlacementPreviewHandler(handler) {
    applyRendererPlacementPreviewHandler(this, handler);
  }

  setEntitySelectHandler(handler) {
    applyRendererEntitySelectHandler(this, handler);
  }

  screenToGround(clientX, clientY) {
    return dispatchLegacyGroundPickAtScreen(this, clientX, clientY);
  }

  screenToEntity(clientX, clientY) {
    return dispatchLegacyEntityPickAtScreen(this, clientX, clientY);
  }

  handlePointerDown(event) {
    beginLegacyPointerDrag(this.dragState, event.clientX, event.clientY);
  }

  handlePointerMove(event) {
    dispatchLegacyPointerMove(this, event);
  }

  handlePointerUp(event) {
    dispatchLegacyPointerUp(this, event);
  }

  handleWheel(event) {
    dispatchLegacyWheel(this, event);
  }

  handleTouchStart(event) {
    dispatchLegacyTouchStart(this, event);
  }

  handleTouchMove(event) {
    dispatchLegacyTouchMove(this, event);
  }

  handleTouchEnd() {
    dispatchLegacyTouchEnd(this);
  }

  setPreviewPosition(position, valid = true) {
    dispatchLegacyPreviewSet(this, position, valid);
  }

  clearPreview() {
    dispatchLegacyPreviewClear(this);
  }

  updatePlacementMarker(position, valid) {
    dispatchLegacyPlacementMarker(this, position, valid);
  }

  centerOnBuilding(building) {
    dispatchLegacyCameraCenter(this, building);
  }

  getCameraState() {
    return buildLegacyCameraState({
      rootElement: this.rootElement,
      cameraTarget: this.cameraTarget,
      worldRadius: 30,
    });
  }

  getDebugStats() {
    return buildLegacyDebugStats(this.smoothedFps);
  }

  syncBuildings(state) {
    dispatchLegacyBuildingSync(this, state, { dependencies: { three: THREE } });
  }

  syncColonists(state) {
    dispatchLegacyColonistSync(this, state, { dependencies: { three: THREE } });
  }

  render(state) {
    dispatchLegacyFrame(this, state);
  }

  dispose() {
    disposeLegacyRendererRuntime(buildLegacyDisposeInvocation(this));
  }
}

