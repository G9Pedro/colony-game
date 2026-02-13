import * as THREE from '../../node_modules/three/build/three.module.js';
import { BUILDING_DEFINITIONS } from '../content/buildings.js';

const BUILDING_Y_BASE = 0.01;

function createBuildingMesh(building) {
  const definition = BUILDING_DEFINITIONS[building.type];
  const [sx, sy, sz] = definition.size;
  const geometry = new THREE.BoxGeometry(sx, sy, sz);
  const material = new THREE.MeshLambertMaterial({ color: definition.color });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(building.x, BUILDING_Y_BASE + sy / 2, building.z);
  mesh.userData.entityId = building.id;
  return mesh;
}

function createColonistMesh(colonist) {
  const geometry = new THREE.SphereGeometry(0.28, 12, 12);
  const color = colonist.job === 'builder' ? 0xf59e0b : 0xf97316;
  const material = new THREE.MeshLambertMaterial({ color });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(colonist.position.x, 0.32, colonist.position.z);
  mesh.userData.entityId = colonist.id;
  return mesh;
}

export class SceneRenderer {
  constructor(rootElement) {
    this.rootElement = rootElement;
    this.onGroundClick = null;
    this.onPlacementPreview = null;

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
    window.addEventListener('resize', () => this.resize());

    this.renderer.domElement.addEventListener('pointerdown', (event) => this.handlePointerDown(event));
    this.renderer.domElement.addEventListener('pointermove', (event) => this.handlePointerMove(event));
    this.renderer.domElement.addEventListener('pointerup', (event) => this.handlePointerUp(event));
    this.renderer.domElement.addEventListener('wheel', (event) => this.handleWheel(event), { passive: false });

    this.renderer.domElement.addEventListener('touchstart', (event) => this.handleTouchStart(event), {
      passive: false,
    });
    this.renderer.domElement.addEventListener('touchmove', (event) => this.handleTouchMove(event), {
      passive: false,
    });
    this.renderer.domElement.addEventListener('touchend', () => this.handleTouchEnd(), {
      passive: false,
    });
  }

  updateCamera() {
    const { radius, yaw, pitch } = this.cameraPolar;
    const x = Math.cos(yaw) * Math.cos(pitch) * radius;
    const y = Math.sin(pitch) * radius;
    const z = Math.sin(yaw) * Math.cos(pitch) * radius;

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

  screenToGround(clientX, clientY) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObject(this.groundPlane);
    if (intersects.length === 0) {
      return null;
    }
    return intersects[0].point;
  }

  handlePointerDown(event) {
    this.dragState.active = true;
    this.dragState.moved = false;
    this.dragState.lastX = event.clientX;
    this.dragState.lastY = event.clientY;
  }

  handlePointerMove(event) {
    const point = this.screenToGround(event.clientX, event.clientY);
    if (point && this.onPlacementPreview) {
      this.onPlacementPreview({ x: point.x, z: point.z });
    }

    if (!this.dragState.active) {
      return;
    }
    const dx = event.clientX - this.dragState.lastX;
    const dy = event.clientY - this.dragState.lastY;
    if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
      this.dragState.moved = true;
    }
    this.dragState.lastX = event.clientX;
    this.dragState.lastY = event.clientY;

    const rotateFactor = 0.0055;
    this.cameraPolar.yaw -= dx * rotateFactor;
    this.cameraPolar.pitch = Math.min(1.25, Math.max(0.25, this.cameraPolar.pitch + dy * rotateFactor));
    this.updateCamera();
  }

  handlePointerUp(event) {
    if (!this.dragState.active) {
      return;
    }
    this.dragState.active = false;

    if (this.dragState.moved) {
      return;
    }

    const point = this.screenToGround(event.clientX, event.clientY);
    if (!point || !this.onGroundClick) {
      return;
    }

    this.onGroundClick({ x: point.x, z: point.z });
  }

  handleWheel(event) {
    event.preventDefault();
    const nextRadius = this.cameraPolar.radius + event.deltaY * 0.03;
    this.cameraPolar.radius = Math.max(16, Math.min(68, nextRadius));
    this.updateCamera();
  }

  handleTouchStart(event) {
    if (event.touches.length === 2) {
      const [first, second] = event.touches;
      this.touchState.isPinching = true;
      this.touchState.pinchDistance = Math.hypot(
        second.clientX - first.clientX,
        second.clientY - first.clientY,
      );
      return;
    }

    if (event.touches.length === 1) {
      const touch = event.touches[0];
      this.handlePointerDown(touch);
    }
  }

  handleTouchMove(event) {
    event.preventDefault();
    if (event.touches.length === 2 && this.touchState.isPinching) {
      const [first, second] = event.touches;
      const distance = Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY);
      const delta = this.touchState.pinchDistance - distance;
      this.cameraPolar.radius = Math.max(16, Math.min(68, this.cameraPolar.radius + delta * 0.04));
      this.touchState.pinchDistance = distance;
      this.updateCamera();
      return;
    }

    if (event.touches.length === 1) {
      const touch = event.touches[0];
      this.handlePointerMove(touch);
    }
  }

  handleTouchEnd() {
    this.touchState.isPinching = false;
    this.handlePointerUp({
      clientX: this.dragState.lastX,
      clientY: this.dragState.lastY,
    });
  }

  updatePlacementMarker(position, valid) {
    if (!position) {
      this.previewMarker.visible = false;
      return;
    }
    this.previewMarker.visible = true;
    this.previewMarker.position.x = position.x;
    this.previewMarker.position.z = position.z;
    this.previewMarker.material.color.setHex(valid ? 0x22c55e : 0xef4444);
  }

  syncBuildings(state) {
    const liveIds = new Set(state.buildings.map((building) => building.id));

    for (const [id, mesh] of this.buildingMeshes.entries()) {
      if (liveIds.has(id)) {
        continue;
      }
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      mesh.material.dispose();
      this.buildingMeshes.delete(id);
    }

    for (const building of state.buildings) {
      if (this.buildingMeshes.has(building.id)) {
        continue;
      }
      const mesh = createBuildingMesh(building);
      this.buildingMeshes.set(building.id, mesh);
      this.scene.add(mesh);
    }
  }

  syncColonists(state) {
    const liveColonists = state.colonists.filter((colonist) => colonist.alive);
    const liveIds = new Set(liveColonists.map((colonist) => colonist.id));

    for (const [id, mesh] of this.colonistMeshes.entries()) {
      if (liveIds.has(id)) {
        continue;
      }
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      mesh.material.dispose();
      this.colonistMeshes.delete(id);
    }

    for (const colonist of liveColonists) {
      let mesh = this.colonistMeshes.get(colonist.id);
      if (!mesh) {
        mesh = createColonistMesh(colonist);
        this.colonistMeshes.set(colonist.id, mesh);
        this.scene.add(mesh);
      }

      mesh.position.x = colonist.position.x;
      mesh.position.z = colonist.position.z;
      mesh.position.y = 0.3 + Math.sin((state.timeSeconds + colonist.age) * 2) * 0.04;
    }
  }

  render(state) {
    this.syncBuildings(state);
    this.syncColonists(state);
    this.renderer.render(this.scene, this.camera);
  }
}
