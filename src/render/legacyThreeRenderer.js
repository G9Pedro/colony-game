import * as THREE from '../../node_modules/three/build/three.module.js';
import { BUILDING_DEFINITIONS } from '../content/buildings.js';
import { applyLegacyCameraPose, computeLegacyCameraPosition } from './legacyCameraPose.js';
import { createLegacyBuildingMesh, createLegacyColonistMesh } from './legacyMeshFactory.js';
import { reconcileMeshMap, updateColonistMeshPose } from './legacyEntitySync.js';
import { runLegacyFrame } from './legacyFrameRender.js';
import {
  updateOrbitYawAndPitch,
  updateRadiusFromPinch,
  updateRadiusFromWheel,
} from './legacyThreeCameraControls.js';
import {
  handleLegacyPointerMoveEvent,
  handleLegacyTouchEndEvent,
  handleLegacyTouchMoveEvent,
  handleLegacyTouchStartEvent,
  handleLegacyWheelEvent,
} from './legacyInteractionHandlers.js';
import {
  getTouchDistance,
  hasPointerMovedBeyondThreshold,
  toPointerLikeTouch,
} from './legacyInteractionPrimitives.js';
import { handleLegacyPointerUpEvent } from './legacyPointerUpHandler.js';
import { beginLegacyPointerDrag, updateLegacyPointerDrag } from './legacyPointerState.js';
import { bindLegacyRendererEvents, disposeMeshMap } from './legacyRendererLifecycle.js';
import { createLegacyRendererEventSession } from './legacyRendererEvents.js';
import { applyLegacyRendererEventSession } from './legacyRendererEventState.js';
import { syncLegacyBuildingMeshes, syncLegacyColonistMeshes } from './legacyRenderSync.js';
import { beginLegacyPinch, endLegacyPinch, updateLegacyPinch } from './legacyTouchState.js';
import { applyLegacyPreviewMarker } from './legacyRendererViewState.js';
import { buildLegacyFrameInvocation } from './legacyFrameInvocation.js';
import { createLegacyRendererRuntime } from './legacyRendererRuntime.js';
import { buildLegacyCameraState, buildLegacyDebugStats } from './legacyRendererSnapshots.js';
import { centerLegacyCameraOnBuilding, resizeLegacyRendererViewport } from './legacyRendererViewport.js';
import { pickLegacyEntityAtClient, pickLegacyGroundAtClient } from './legacyScreenPickers.js';

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
    this.camera = runtime.camera;
    this.cameraTarget = runtime.cameraTarget;
    this.cameraPolar = runtime.cameraPolar;
    this.renderer = runtime.renderer;
    this.raycaster = runtime.raycaster;
    this.mouse = runtime.mouse;
    this.groundPlane = runtime.groundPlane;
    this.previewMarker = runtime.previewMarker;
    this.dragState = runtime.dragState;
    this.touchState = runtime.touchState;
    this.buildingMeshes = runtime.buildingMeshes;
    this.colonistMeshes = runtime.colonistMeshes;

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
    handleLegacyPointerMoveEvent({
      event,
      screenToGround: (clientX, clientY) => this.screenToGround(clientX, clientY),
      onPlacementPreview: this.onPlacementPreview,
      dragState: this.dragState,
      updateLegacyPointerDrag,
      hasPointerMovedBeyondThreshold,
      cameraPolar: this.cameraPolar,
      updateOrbitYawAndPitch,
      updateCamera: () => this.updateCamera(),
    });
  }

  handlePointerUp(event) {
    handleLegacyPointerUpEvent({
      event,
      dragState: this.dragState,
      onEntitySelect: this.onEntitySelect,
      onGroundClick: this.onGroundClick,
      screenToEntity: (clientX, clientY) => this.screenToEntity(clientX, clientY),
      screenToGround: (clientX, clientY) => this.screenToGround(clientX, clientY),
    });
  }

  handleWheel(event) {
    handleLegacyWheelEvent({
      event,
      cameraPolar: this.cameraPolar,
      updateRadiusFromWheel,
      updateCamera: () => this.updateCamera(),
    });
  }

  handleTouchStart(event) {
    handleLegacyTouchStartEvent({
      event,
      touchState: this.touchState,
      beginLegacyPinch,
      getTouchDistance,
      toPointerLikeTouch,
      handlePointerDown: (pointerLikeTouch) => this.handlePointerDown(pointerLikeTouch),
    });
  }

  handleTouchMove(event) {
    handleLegacyTouchMoveEvent({
      event,
      touchState: this.touchState,
      getTouchDistance,
      updateRadiusFromPinch,
      updateLegacyPinch,
      cameraPolar: this.cameraPolar,
      updateCamera: () => this.updateCamera(),
      toPointerLikeTouch,
      handlePointerMove: (pointerLikeTouch) => this.handlePointerMove(pointerLikeTouch),
    });
  }

  handleTouchEnd() {
    handleLegacyTouchEndEvent({
      touchState: this.touchState,
      endLegacyPinch,
      dragState: this.dragState,
      handlePointerUp: (pointerLikeTouch) => this.handlePointerUp(pointerLikeTouch),
    });
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
    syncLegacyBuildingMeshes({
      state,
      buildingMeshes: this.buildingMeshes,
      scene: this.scene,
      three: THREE,
      buildingDefinitions: BUILDING_DEFINITIONS,
      reconcileMeshMap,
      createLegacyBuildingMesh,
    });
  }

  syncColonists(state) {
    syncLegacyColonistMeshes({
      state,
      colonistMeshes: this.colonistMeshes,
      scene: this.scene,
      three: THREE,
      reconcileMeshMap,
      createLegacyColonistMesh,
      updateColonistMeshPose,
    });
  }

  render(state) {
    const frame = runLegacyFrame(buildLegacyFrameInvocation({
      renderer: this,
      state,
      now: performance.now(),
    }));
    this.lastFrameAt = frame.nextLastFrameAt;
    this.smoothedFps = frame.nextSmoothedFps;
  }

  dispose() {
    this.unbindEvents?.();
    this.unbindEvents = null;

    disposeMeshMap(this.buildingMeshes);
    disposeMeshMap(this.colonistMeshes);

    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}

