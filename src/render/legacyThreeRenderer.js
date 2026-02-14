import * as THREE from '../../node_modules/three/build/three.module.js';
import { BUILDING_DEFINITIONS } from '../content/buildings.js';
import { normalizeCameraState } from './cameraState.js';
import { createDebugStats } from './debugStats.js';
import { createLegacyBuildingMesh, createLegacyColonistMesh } from './legacyMeshFactory.js';
import { reconcileMeshMap, updateColonistMeshPose } from './legacyEntitySync.js';
import { computeFrameDeltaSeconds, updateSmoothedFps } from './frameTiming.js';
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
import { beginLegacyPointerDrag, endLegacyPointerDrag, updateLegacyPointerDrag } from './legacyPointerState.js';
import { bindLegacyRendererEvents, disposeMeshMap } from './legacyRendererLifecycle.js';
import { buildEntitySelectionFromObject, clientToNdc } from './legacyRaycastUtils.js';
import { pickEntitySelectionFromClient, pickGroundPointFromClient } from './legacyRaycastSession.js';
import { beginLegacyPinch, endLegacyPinch, updateLegacyPinch } from './legacyTouchState.js';

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
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.72);
    const sunlight = new THREE.DirectionalLight(0xffffff, 1.15);
    sunlight.position.set(22, 40, 12);
    this.scene.add(ambientLight, sunlight);

    const groundGeometry = new THREE.PlaneGeometry(64, 64, 1, 1);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x4d7c0f });
    this.groundPlane = new THREE.Mesh(groundGeometry, groundMaterial);
    this.groundPlane.rotation.x = -Math.PI / 2;
    this.groundPlane.position.y = 0;
    this.groundPlane.userData.isGround = true;
    this.scene.add(this.groundPlane);

    const grid = new THREE.GridHelper(64, 32, 0x334155, 0x64748b);
    grid.position.y = 0.01;
    this.scene.add(grid);

    const markerGeometry = new THREE.CylinderGeometry(0.6, 0.6, 0.14, 16);
    const markerMaterial = new THREE.MeshBasicMaterial({ color: 0x22c55e, transparent: true, opacity: 0.65 });
    this.previewMarker = new THREE.Mesh(markerGeometry, markerMaterial);
    this.previewMarker.position.y = 0.08;
    this.previewMarker.visible = false;
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
    const { radius, yaw, pitch } = this.cameraPolar;
    const x = Math.cos(yaw) * Math.cos(pitch) * radius + this.cameraTarget.x;
    const y = Math.sin(pitch) * radius;
    const z = Math.sin(yaw) * Math.cos(pitch) * radius + this.cameraTarget.z;

    this.camera.position.set(x, y, z);
    this.camera.lookAt(this.cameraTarget);
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
    if (!dragEnd.active) {
      return;
    }

    if (dragEnd.moved) {
      return;
    }

    const selectedEntity = this.screenToEntity(dragEnd.clientX, dragEnd.clientY);
    if (selectedEntity && this.onEntitySelect) {
      this.onEntitySelect(selectedEntity);
      return;
    }

    const point = this.screenToGround(dragEnd.clientX, dragEnd.clientY);
    const clickPoint = toRoundedGroundPoint(point);
    if (!clickPoint) {
      return;
    }
    if (this.onGroundClick) {
      this.onGroundClick(clickPoint);
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
    if (!position) {
      this.clearPreview();
      return;
    }
    this.previewMarker.visible = true;
    this.previewMarker.position.x = position.x;
    this.previewMarker.position.z = position.z;
    this.previewMarker.material.color.setHex(valid ? 0x22c55e : 0xef4444);
  }

  clearPreview() {
    this.previewMarker.visible = false;
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
    return normalizeCameraState({
      mode: 'three',
      projection: 'perspective',
      centerX: this.cameraTarget.x,
      centerZ: this.cameraTarget.z,
      zoom: 1,
      width: this.rootElement.clientWidth,
      height: this.rootElement.clientHeight,
      worldRadius: 30,
    }, {
      mode: 'three',
      projection: 'perspective',
    });
  }

  getDebugStats() {
    return createDebugStats({
      mode: 'three',
      fps: this.smoothedFps,
      quality: 1,
      particles: 0,
      particleCap: 0,
    });
  }

  syncBuildings(state) {
    reconcileMeshMap({
      entities: state.buildings,
      meshMap: this.buildingMeshes,
      scene: this.scene,
      getId: (building) => building.id,
      createMesh: (building) => createLegacyBuildingMesh(building, BUILDING_DEFINITIONS, THREE),
    });
  }

  syncColonists(state) {
    const liveColonists = state.colonists.filter((colonist) => colonist.alive);
    reconcileMeshMap({
      entities: liveColonists,
      meshMap: this.colonistMeshes,
      scene: this.scene,
      getId: (colonist) => colonist.id,
      createMesh: (colonist) => createLegacyColonistMesh(colonist, THREE),
    });

    for (const colonist of liveColonists) {
      const mesh = this.colonistMeshes.get(colonist.id);
      if (!mesh) {
        continue;
      }
      updateColonistMeshPose(mesh, colonist, state.timeSeconds);
    }
  }

  render(state) {
    const now = performance.now();
    const deltaSeconds = computeFrameDeltaSeconds(now, this.lastFrameAt, 0.2);
    this.lastFrameAt = now;
    this.smoothedFps = updateSmoothedFps(this.smoothedFps, deltaSeconds, 0.9);
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

