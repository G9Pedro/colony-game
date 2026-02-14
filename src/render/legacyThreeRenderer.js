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
import { buildEntitySelectionFromObject, clientToNdc } from './legacyRaycastUtils.js';
import { pickEntitySelectionFromClient, pickGroundPointFromClient } from './legacyRaycastSession.js';
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

    this.camera = new THREE.PerspectiveCamera(65, 1, 0.1, 300);
    this.cameraTarget = new THREE.Vector3(0, 0, 0);
    this.cameraPolar = {
      radius: 42,
      yaw: Math.PI / 4,
      pitch: 0.72,
    };
    this.updateCamera();

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = false;
    rootElement.appendChild(this.renderer.domElement);

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.groundPlane = null;
    this.previewMarker = null;

    this.dragState = {
      active: false,
      moved: false,
      lastX: 0,
      lastY: 0,
    };

    this.touchState = {
      isPinching: false,
      pinchDistance: 0,
    };

    this.buildingMeshes = new Map();
    this.colonistMeshes = new Map();

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
    this.boundResize = () => this.resize();
    this.boundPointerDown = (event) => this.handlePointerDown(event);
    this.boundPointerMove = (event) => this.handlePointerMove(event);
    this.boundPointerUp = (event) => this.handlePointerUp(event);
    this.boundWheel = (event) => this.handleWheel(event);
    this.boundTouchStart = (event) => this.handleTouchStart(event);
    this.boundTouchMove = (event) => this.handleTouchMove(event);
    this.boundTouchEnd = () => this.handleTouchEnd();
    this.unbindEvents = bindLegacyRendererEvents({
      windowObject: window,
      domElement: this.renderer.domElement,
      onResize: this.boundResize,
      onPointerDown: this.boundPointerDown,
      onPointerMove: this.boundPointerMove,
      onPointerUp: this.boundPointerUp,
      onWheel: this.boundWheel,
      onTouchStart: this.boundTouchStart,
      onTouchMove: this.boundTouchMove,
      onTouchEnd: this.boundTouchEnd,
    });
  }

  updateCamera() {
    const position = computeLegacyCameraPosition(this.cameraPolar, this.cameraTarget);
    applyLegacyCameraPose(this.camera, this.cameraTarget, position);
  }

  resize() {
    const width = this.rootElement.clientWidth;
    const height = this.rootElement.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
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
    return pickGroundPointFromClient({
      clientX,
      clientY,
      domElement: this.renderer.domElement,
      mouse: this.mouse,
      raycaster: this.raycaster,
      camera: this.camera,
      groundPlane: this.groundPlane,
      toNdc: clientToNdc,
    });
  }

  screenToEntity(clientX, clientY) {
    const targets = [
      ...this.buildingMeshes.values(),
      ...this.colonistMeshes.values(),
    ];
    return pickEntitySelectionFromClient({
      clientX,
      clientY,
      domElement: this.renderer.domElement,
      mouse: this.mouse,
      raycaster: this.raycaster,
      camera: this.camera,
      targets,
      toNdc: clientToNdc,
      mapSelectionFromObject: buildEntitySelectionFromObject,
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
    if (!building) {
      return;
    }
    this.cameraTarget.set(building.x, 0, building.z);
    this.updateCamera();
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

