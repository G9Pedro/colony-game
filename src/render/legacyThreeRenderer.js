import * as THREE from '../../node_modules/three/build/three.module.js';
import { applyLegacyCameraPose, computeLegacyCameraPosition } from './legacyCameraPose.js';
import { runLegacyFrame } from './legacyFrameRender.js';
import {
  handleLegacyPointerMoveEvent,
  handleLegacyTouchEndEvent,
  handleLegacyTouchMoveEvent,
  handleLegacyTouchStartEvent,
  handleLegacyWheelEvent,
} from './legacyInteractionHandlers.js';
import { handleLegacyPointerUpEvent } from './legacyPointerUpHandler.js';
import { beginLegacyPointerDrag } from './legacyPointerState.js';
import {
  bindLegacyRendererEvents,
  disposeLegacyRendererRuntime,
} from './legacyRendererLifecycle.js';
import { createLegacyRendererEventSession } from './legacyRendererEvents.js';
import { applyLegacyRendererEventSession } from './legacyRendererEventState.js';
import { applyLegacyRendererRuntimeState } from './legacyRendererRuntimeState.js';
import { buildLegacyBuildingSyncInvocation, buildLegacyColonistSyncInvocation } from './legacyMeshSyncInvocation.js';
import {
  buildLegacyPointerMoveInvocation,
  buildLegacyPointerUpInvocation,
  buildLegacyTouchEndInvocation,
  buildLegacyTouchMoveInvocation,
  buildLegacyTouchStartInvocation,
  buildLegacyWheelInvocation,
} from './legacyInteractionInvocation.js';
import { syncLegacyBuildingMeshes, syncLegacyColonistMeshes } from './legacyRenderSync.js';
import { applyLegacyPreviewMarker } from './legacyRendererViewState.js';
import { buildLegacyFrameInvocation } from './legacyFrameInvocation.js';
import { createLegacyRendererRuntime } from './legacyRendererRuntime.js';
import { buildLegacyCameraState, buildLegacyDebugStats } from './legacyRendererSnapshots.js';
import { centerLegacyCameraOnBuilding, resizeLegacyRendererViewport } from './legacyRendererViewport.js';
import { pickLegacyEntityAtClient, pickLegacyGroundAtClient } from './legacyScreenPickers.js';
import { applyRendererFrameState } from './rendererFrameState.js';

export class LegacyThreeRenderer {
  constructor(rootElement) {
    this.rootElement = rootElement;
    this.onGroundClick = null;
    this.onPlacementPreview = null;
    this.onEntitySelect = null;
    this.lastFrameAt = performance.now();
    this.smoothedFps = 60;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x9ad6f7);

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
    const session = createLegacyRendererEventSession({
      windowObject: window,
      domElement: this.renderer.domElement,
      onResize: () => this.resize(),
      onPointerDown: (event) => this.handlePointerDown(event),
      onPointerMove: (event) => this.handlePointerMove(event),
      onPointerUp: (event) => this.handlePointerUp(event),
      onWheel: (event) => this.handleWheel(event),
      onTouchStart: (event) => this.handleTouchStart(event),
      onTouchMove: (event) => this.handleTouchMove(event),
      onTouchEnd: () => this.handleTouchEnd(),
      bindEvents: bindLegacyRendererEvents,
    });
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
    this.onGroundClick = handler;
  }

  setPlacementPreviewHandler(handler) {
    this.onPlacementPreview = handler;
  }

  setEntitySelectHandler(handler) {
    this.onEntitySelect = handler;
  }

  screenToGround(clientX, clientY) {
    return pickLegacyGroundAtClient({
      clientX,
      clientY,
      domElement: this.renderer.domElement,
      mouse: this.mouse,
      raycaster: this.raycaster,
      camera: this.camera,
      groundPlane: this.groundPlane,
    });
  }

  screenToEntity(clientX, clientY) {
    return pickLegacyEntityAtClient({
      clientX,
      clientY,
      domElement: this.renderer.domElement,
      mouse: this.mouse,
      raycaster: this.raycaster,
      camera: this.camera,
      buildingMeshes: this.buildingMeshes,
      colonistMeshes: this.colonistMeshes,
    });
  }

  handlePointerDown(event) {
    beginLegacyPointerDrag(this.dragState, event.clientX, event.clientY);
  }

  handlePointerMove(event) {
    handleLegacyPointerMoveEvent(buildLegacyPointerMoveInvocation(this, event));
  }

  handlePointerUp(event) {
    handleLegacyPointerUpEvent(buildLegacyPointerUpInvocation(this, event));
  }

  handleWheel(event) {
    handleLegacyWheelEvent(buildLegacyWheelInvocation(this, event));
  }

  handleTouchStart(event) {
    handleLegacyTouchStartEvent(buildLegacyTouchStartInvocation(this, event));
  }

  handleTouchMove(event) {
    handleLegacyTouchMoveEvent(buildLegacyTouchMoveInvocation(this, event));
  }

  handleTouchEnd() {
    handleLegacyTouchEndEvent(buildLegacyTouchEndInvocation(this));
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

