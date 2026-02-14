import * as THREE from '../../node_modules/three/build/three.module.js';
import { applyLegacyCameraPose, computeLegacyCameraPosition } from './legacyCameraPose.js';
import { runLegacyFrame } from './legacyFrameRender.js';
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
import { applyLegacyRendererEventSession } from './legacyRendererEventState.js';
import { applyLegacyRendererRuntimeState } from './legacyRendererRuntimeState.js';
import { buildLegacyBuildingSyncInvocation, buildLegacyColonistSyncInvocation } from './legacyMeshSyncInvocation.js';
import { syncLegacyBuildingMeshes, syncLegacyColonistMeshes } from './legacyRenderSync.js';
import { applyLegacyPreviewMarker } from './legacyRendererViewState.js';
import { buildLegacyFrameInvocation } from './legacyFrameInvocation.js';
import { createLegacyRendererRuntime } from './legacyRendererRuntime.js';
import { buildLegacyCameraState, buildLegacyDebugStats } from './legacyRendererSnapshots.js';
import { dispatchLegacyEntityPick, dispatchLegacyGroundPick } from './legacyPickerDispatch.js';
import {
  applyRendererEntitySelectHandler,
  applyRendererGroundClickHandler,
  applyRendererPlacementPreviewHandler,
} from './rendererCallbackState.js';
import { centerLegacyCameraOnBuilding, resizeLegacyRendererViewport } from './legacyRendererViewport.js';
import { applyRendererFrameState } from './rendererFrameState.js';

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
    const position = computeLegacyCameraPosition(this.cameraPolar, this.cameraTarget);
    applyLegacyCameraPose(this.camera, this.cameraTarget, position);
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
    applyLegacyPreviewMarker(this.previewMarker, position, valid);
  }

  clearPreview() {
    this.setPreviewPosition(null);
  }

  updatePlacementMarker(position, valid) {
    this.setPreviewPosition(position, valid);
  }

  centerOnBuilding(building) {
    centerLegacyCameraOnBuilding(building, this.cameraTarget, () => this.updateCamera());
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
    const frame = runLegacyFrame(buildLegacyFrameInvocation({
      renderer: this,
      state,
      now: performance.now(),
    }));
    applyRendererFrameState(this, frame);
  }

  dispose() {
    disposeLegacyRendererRuntime({
      unbindEvents: this.unbindEvents,
      setUnbindEvents: (value) => {
        this.unbindEvents = value;
      },
      buildingMeshes: this.buildingMeshes,
      colonistMeshes: this.colonistMeshes,
      renderer: this.renderer,
    });
  }
}

