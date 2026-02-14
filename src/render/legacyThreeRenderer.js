import * as THREE from '../../node_modules/three/build/three.module.js';
import { BUILDING_DEFINITIONS } from '../content/buildings.js';
import { normalizeCameraState } from './cameraState.js';
import { createDebugStats } from './debugStats.js';
import { applyLegacyCameraPose, computeLegacyCameraPosition } from './legacyCameraPose.js';
import { createLegacyBuildingMesh, createLegacyColonistMesh } from './legacyMeshFactory.js';
import { reconcileMeshMap, updateColonistMeshPose } from './legacyEntitySync.js';
import { computeFrameDeltaSeconds, updateSmoothedFps } from './frameTiming.js';
import { buildLegacyFrameContext } from './legacyFrameContext.js';
import {
  updateOrbitYawAndPitch,
  updateRadiusFromPinch,
  updateRadiusFromWheel,
} from './legacyThreeCameraControls.js';
import {
  getTouchDistance,
  hasPointerMovedBeyondThreshold,
  toPointerLikeTouch,
  toRoundedGroundPoint,
} from './legacyInteractionPrimitives.js';
import { resolveLegacyPointerUpOutcome } from './legacyInteractionOutcomes.js';
import { beginLegacyPointerDrag, endLegacyPointerDrag, updateLegacyPointerDrag } from './legacyPointerState.js';
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
    const point = this.screenToGround(event.clientX, event.clientY);
    if (point && this.onPlacementPreview) {
      this.onPlacementPreview({ x: Math.round(point.x), z: Math.round(point.z) });
    }

    const dragUpdate = updateLegacyPointerDrag(
      this.dragState,
      event.clientX,
      event.clientY,
      hasPointerMovedBeyondThreshold,
      1,
    );
    if (!dragUpdate.active) {
      return;
    }

    const nextPolar = updateOrbitYawAndPitch(this.cameraPolar, dragUpdate.dx, dragUpdate.dy, 0.0055);
    this.cameraPolar.yaw = nextPolar.yaw;
    this.cameraPolar.pitch = nextPolar.pitch;
    this.updateCamera();
  }

  handlePointerUp(event) {
    const dragEnd = endLegacyPointerDrag(this.dragState);
    const outcome = resolveLegacyPointerUpOutcome({
      dragEnd,
      pickEntity: (clientX, clientY) => this.screenToEntity(clientX, clientY),
      pickGround: (clientX, clientY) => this.screenToGround(clientX, clientY),
      roundGroundPoint: toRoundedGroundPoint,
    });
    if (outcome.type === 'none') {
      return;
    }
    if (outcome.type === 'select-entity') {
      if (this.onEntitySelect) {
        this.onEntitySelect(outcome.entity);
      }
      return;
    }
    if (outcome.type === 'ground-click' && this.onGroundClick) {
      this.onGroundClick(outcome.point);
    }
  }

  handleWheel(event) {
    event.preventDefault();
    this.cameraPolar.radius = updateRadiusFromWheel(this.cameraPolar.radius, event.deltaY, 0.03);
    this.updateCamera();
  }

  handleTouchStart(event) {
    if (event.touches.length === 2) {
      const [first, second] = event.touches;
      beginLegacyPinch(this.touchState, first, second, getTouchDistance);
      return;
    }

    if (event.touches.length === 1) {
      const touch = event.touches[0];
      this.handlePointerDown(toPointerLikeTouch(touch));
    }
  }

  handleTouchMove(event) {
    event.preventDefault();
    if (event.touches.length === 2 && this.touchState.isPinching) {
      const [first, second] = event.touches;
      const pinchUpdate = updateLegacyPinch(
        this.touchState,
        first,
        second,
        getTouchDistance,
        updateRadiusFromPinch,
        this.cameraPolar.radius,
        0.04,
      );
      this.cameraPolar.radius = pinchUpdate.radius;
      this.updateCamera();
      return;
    }

    if (event.touches.length === 1) {
      const touch = event.touches[0];
      this.handlePointerMove(toPointerLikeTouch(touch));
    }
  }

  handleTouchEnd() {
    endLegacyPinch(this.touchState);
    this.handlePointerUp({
      clientX: this.dragState.lastX,
      clientY: this.dragState.lastY,
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
    const frame = buildLegacyFrameContext({
      now: performance.now(),
      lastFrameAt: this.lastFrameAt,
      smoothedFps: this.smoothedFps,
      computeFrameDeltaSeconds,
      updateSmoothedFps,
      maxDeltaSeconds: 0.2,
      fpsSmoothing: 0.9,
    });
    this.lastFrameAt = frame.nextLastFrameAt;
    this.smoothedFps = frame.nextSmoothedFps;
    this.syncBuildings(state);
    this.syncColonists(state);
    this.renderer.render(this.scene, this.camera);
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

