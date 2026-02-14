import * as THREE from '../../node_modules/three/build/three.module.js';
import { dispatchLegacyCameraUpdate, dispatchLegacyCenterOnBuilding } from './legacyCameraDispatch.js';
import {
  dispatchLegacyPointerMove,
  dispatchLegacyPointerUp,
  dispatchLegacyTouchEnd,
  dispatchLegacyTouchMove,
  dispatchLegacyTouchStart,
  dispatchLegacyWheel,
} from './legacyInteractionDispatch.js';
import { bindLegacyRendererEvents, disposeLegacyRendererRuntime } from './legacyRendererLifecycle.js';
import { beginLegacyPointerDrag } from './legacyPointerState.js';
import { createLegacyRendererBaseState } from './legacyRendererBaseState.js';
import { buildLegacyEventSessionInvocation } from './legacyEventSessionInvocation.js';
import { createLegacyRendererEventSession } from './legacyRendererEvents.js';
import { dispatchLegacyFrame } from './legacyFrameDispatch.js';
import { applyLegacyRendererEventSession } from './legacyRendererEventState.js';
import {
  clearLegacyPreviewPosition,
  setLegacyPreviewPosition,
  updateLegacyPlacementPreview,
} from './legacyPreviewHandlers.js';
import { applyLegacyRendererRuntimeState } from './legacyRendererRuntimeState.js';
import { buildLegacyBuildingSyncInvocation, buildLegacyColonistSyncInvocation } from './legacyMeshSyncInvocation.js';
import { syncLegacyBuildingMeshes, syncLegacyColonistMeshes } from './legacyRenderSync.js';
import { createLegacyRendererRuntime } from './legacyRendererRuntime.js';
import { buildLegacyCameraState, buildLegacyDebugStats } from './legacyRendererSnapshots.js';
import { buildLegacyDisposeInvocation } from './legacyDisposeInvocation.js';
import { dispatchLegacyEntityPick, dispatchLegacyGroundPick } from './legacyPickerDispatch.js';
import {
  applyRendererEntitySelectHandler,
  applyRendererGroundClickHandler,
  applyRendererPlacementPreviewHandler,
} from './rendererCallbackState.js';
import { resizeLegacyRendererViewport } from './legacyRendererViewport.js';

export class LegacyThreeRenderer {
  constructor(rootElement) {
    Object.assign(this, createLegacyRendererBaseState({
      rootElement,
      three: THREE,
      performanceObject: performance,
    }));

    const runtime = createLegacyRendererRuntime({
      rootElement,
      scene: this.scene,
      three: THREE,
      windowObject: window,
      maxPixelRatio: 2,
    });
    applyLegacyRendererRuntimeState(this, runtime);

    this.updateCamera();
    this.resize();
    this.bindEvents();
  }

  bindEvents() {
    const session = createLegacyRendererEventSession(buildLegacyEventSessionInvocation(this, {
      windowObject: window,
      bindEvents: bindLegacyRendererEvents,
    }));
    applyLegacyRendererEventSession(this, session);
  }

  updateCamera() {
    dispatchLegacyCameraUpdate(this);
  }

  resize() {
    resizeLegacyRendererViewport(this.rootElement, this.camera, this.renderer);
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
    return dispatchLegacyGroundPick(this, clientX, clientY);
  }

  screenToEntity(clientX, clientY) {
    return dispatchLegacyEntityPick(this, clientX, clientY);
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
    setLegacyPreviewPosition(this, position, valid);
  }

  clearPreview() {
    clearLegacyPreviewPosition(this);
  }

  updatePlacementMarker(position, valid) {
    updateLegacyPlacementPreview(this, position, valid);
  }

  centerOnBuilding(building) {
    dispatchLegacyCenterOnBuilding(this, building);
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
    syncLegacyBuildingMeshes(buildLegacyBuildingSyncInvocation(this, state, { three: THREE }));
  }

  syncColonists(state) {
    syncLegacyColonistMeshes(buildLegacyColonistSyncInvocation(this, state, { three: THREE }));
  }

  render(state) {
    dispatchLegacyFrame(this, state);
  }

  dispose() {
    disposeLegacyRendererRuntime(buildLegacyDisposeInvocation(this));
  }
}

