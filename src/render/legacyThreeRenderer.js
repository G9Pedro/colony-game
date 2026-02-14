import * as THREE from '../../node_modules/three/build/three.module.js';
import { BUILDING_DEFINITIONS } from '../content/buildings.js';
import { normalizeCameraState } from './cameraState.js';
import { createDebugStats } from './debugStats.js';
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
import { syncLegacyBuildingMeshes, syncLegacyColonistMeshes } from './legacyRenderSync.js';
import {
  createLegacyGrid,
  createLegacyGroundPlane,
  createLegacyLighting,
  createLegacyPreviewMarker,
} from './legacySceneSetup.js';
import { beginLegacyPinch, endLegacyPinch, updateLegacyPinch } from './legacyTouchState.js';
import {
  applyLegacyPreviewMarker,
  buildLegacyCameraStatePayload,
  buildLegacyDebugStatsPayload,
} from './legacyRendererViewState.js';
import {
  createLegacyCameraRig,
  createLegacyInteractionState,
  createLegacyWebGLRenderer,
} from './legacyRendererBootstrap.js';
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

    const cameraRig = createLegacyCameraRig(THREE);
    this.camera = cameraRig.camera;
    this.cameraTarget = cameraRig.cameraTarget;
    this.cameraPolar = cameraRig.cameraPolar;
    this.updateCamera();

    this.renderer = createLegacyWebGLRenderer({
      rootElement,
      three: THREE,
      windowObject: window,
      maxPixelRatio: 2,
    });

    const interactionState = createLegacyInteractionState(THREE);
    this.raycaster = interactionState.raycaster;
    this.mouse = interactionState.mouse;
    this.groundPlane = interactionState.groundPlane;
    this.previewMarker = interactionState.previewMarker;
    this.dragState = interactionState.dragState;
    this.touchState = interactionState.touchState;
    this.buildingMeshes = interactionState.buildingMeshes;
    this.colonistMeshes = interactionState.colonistMeshes;

    this.initializeScene();
    this.resize();
    this.bindEvents();
  }

  initializeScene() {
    const { ambientLight, sunlight } = createLegacyLighting(THREE);
    this.scene.add(ambientLight, sunlight);

    this.groundPlane = createLegacyGroundPlane(THREE);
    this.scene.add(this.groundPlane);

    const grid = createLegacyGrid(THREE);
    this.scene.add(grid);

    this.previewMarker = createLegacyPreviewMarker(THREE);
    this.scene.add(this.previewMarker);
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
    this.boundResize = session.handlers.onResize;
    this.boundPointerDown = session.handlers.onPointerDown;
    this.boundPointerMove = session.handlers.onPointerMove;
    this.boundPointerUp = session.handlers.onPointerUp;
    this.boundWheel = session.handlers.onWheel;
    this.boundTouchStart = session.handlers.onTouchStart;
    this.boundTouchMove = session.handlers.onTouchMove;
    this.boundTouchEnd = session.handlers.onTouchEnd;
    this.unbindEvents = session.unbindEvents;
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
    const payload = buildLegacyCameraStatePayload(this.rootElement, this.cameraTarget, 30);
    return normalizeCameraState(payload, {
      mode: 'three',
      projection: 'perspective',
    });
  }

  getDebugStats() {
    return createDebugStats(buildLegacyDebugStatsPayload(this.smoothedFps));
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
    const frame = runLegacyFrame({
      state,
      now: performance.now(),
      lastFrameAt: this.lastFrameAt,
      smoothedFps: this.smoothedFps,
      syncBuildings: (nextState) => this.syncBuildings(nextState),
      syncColonists: (nextState) => this.syncColonists(nextState),
      renderScene: () => this.renderer.render(this.scene, this.camera),
    });
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

