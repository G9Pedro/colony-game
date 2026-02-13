import * as THREE from '../../node_modules/three/build/three.module.js';
import { BUILDING_DEFINITIONS } from '../content/buildings.js';
import { BUILDING_ICON_ASSETS, SCENE_ASSETS, getColonistSpriteAssetSet } from '../assets/manifest.js';

const BUILDING_Y_BASE = 0.01;
const WALK_FRAME_RATE = 9;

function applyTextureColorSpace(texture) {
  if ('colorSpace' in texture && THREE.SRGBColorSpace) {
    texture.colorSpace = THREE.SRGBColorSpace;
  }
}

function disposeObject3D(object3D) {
  object3D.traverse((child) => {
    if (child.geometry) {
      child.geometry.dispose();
    }
    if (!child.material) {
      return;
    }
    if (Array.isArray(child.material)) {
      child.material.forEach((material) => material.dispose());
      return;
    }
    child.material.dispose();
  });
}

function createBuildingMesh(building, iconTexture) {
  const definition = BUILDING_DEFINITIONS[building.type];
  const [sx, sy, sz] = definition.size;
  const group = new THREE.Group();
  group.position.set(building.x, BUILDING_Y_BASE, building.z);
  group.userData.entityId = building.id;

  const geometry = new THREE.BoxGeometry(sx, sy, sz);
  const material = new THREE.MeshLambertMaterial({ color: definition.color });
  const body = new THREE.Mesh(geometry, material);
  body.position.y = sy / 2;
  group.add(body);

  if (iconTexture) {
    const iconMaterial = new THREE.SpriteMaterial({
      map: iconTexture,
      transparent: true,
      depthWrite: false,
      opacity: 0.95,
    });
    const iconSprite = new THREE.Sprite(iconMaterial);
    iconSprite.scale.set(1.9, 1.9, 1);
    iconSprite.position.y = sy + 1.1;
    group.add(iconSprite);
  }

  return group;
}

function createColonistMesh(colonist, textureSet) {
  const material = new THREE.SpriteMaterial({
    map: textureSet.idle,
    transparent: true,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.center.set(0.5, 0);
  sprite.scale.set(1.2, 1.5, 1);
  sprite.position.set(colonist.position.x, 0.02, colonist.position.z);
  sprite.userData.entityId = colonist.id;
  sprite.userData.animation = {
    setKey: textureSet.key,
    lastX: colonist.position.x,
    lastZ: colonist.position.z,
  };
  return sprite;
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

    this.textureLoader = new THREE.TextureLoader();
    this.groundTexture = this.loadTexture(SCENE_ASSETS.ground, {
      repeat: [12, 12],
    });
    this.gridTexture = this.loadTexture(SCENE_ASSETS.grid);
    this.skyTexture = this.loadTexture(SCENE_ASSETS.sky);
    this.buildingIconTextures = new Map();
    Object.entries(BUILDING_ICON_ASSETS).forEach(([buildingType, url]) => {
      this.buildingIconTextures.set(buildingType, this.loadTexture(url));
    });

    this.colonistTextureSets = {
      default: this.createColonistTextureSet('laborer'),
      builder: this.createColonistTextureSet('builder'),
    };

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

    if (this.skyTexture) {
      this.scene.background = this.skyTexture;
    }

    const groundGeometry = new THREE.PlaneGeometry(64, 64, 1, 1);
    const groundMaterial = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      map: this.groundTexture,
    });
    this.groundPlane = new THREE.Mesh(groundGeometry, groundMaterial);
    this.groundPlane.rotation.x = -Math.PI / 2;
    this.groundPlane.position.y = 0;
    this.groundPlane.userData.isGround = true;
    this.scene.add(this.groundPlane);

    const gridOverlay = new THREE.Mesh(
      new THREE.PlaneGeometry(64, 64, 1, 1),
      new THREE.MeshBasicMaterial({
        map: this.gridTexture,
        transparent: true,
        opacity: 0.35,
        depthWrite: false,
      }),
    );
    gridOverlay.rotation.x = -Math.PI / 2;
    gridOverlay.position.y = 0.02;
    this.scene.add(gridOverlay);

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

  loadTexture(url, options = {}) {
    const texture = this.textureLoader.load(url);
    applyTextureColorSpace(texture);
    texture.anisotropy = 4;
    if (options.repeat) {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(options.repeat[0], options.repeat[1]);
    }
    return texture;
  }

  createColonistTextureSet(job) {
    const spriteAssets = getColonistSpriteAssetSet(job);
    return {
      key: spriteAssets.key,
      idle: this.loadTexture(spriteAssets.idle),
      walk: spriteAssets.walk.map((assetPath) => this.loadTexture(assetPath)),
    };
  }

  getColonistTextureSet(job) {
    return job === 'builder' ? this.colonistTextureSets.builder : this.colonistTextureSets.default;
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
      disposeObject3D(mesh);
      this.buildingMeshes.delete(id);
    }

    for (const building of state.buildings) {
      if (this.buildingMeshes.has(building.id)) {
        continue;
      }
      const iconTexture = this.buildingIconTextures.get(building.type) ?? null;
      const mesh = createBuildingMesh(building, iconTexture);
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
      disposeObject3D(mesh);
      this.colonistMeshes.delete(id);
    }

    for (const colonist of liveColonists) {
      let mesh = this.colonistMeshes.get(colonist.id);
      if (!mesh) {
        mesh = createColonistMesh(colonist, this.getColonistTextureSet(colonist.job));
        this.colonistMeshes.set(colonist.id, mesh);
        this.scene.add(mesh);
      }

      const textureSet = this.getColonistTextureSet(colonist.job);
      const animationState = mesh.userData.animation;
      const movementDelta = Math.hypot(
        colonist.position.x - animationState.lastX,
        colonist.position.z - animationState.lastZ,
      );
      animationState.lastX = colonist.position.x;
      animationState.lastZ = colonist.position.z;

      if (animationState.setKey !== textureSet.key) {
        animationState.setKey = textureSet.key;
        mesh.material.map = textureSet.idle;
        mesh.material.needsUpdate = true;
      }

      const isWalking = movementDelta > 0.002;
      const nextFrameTexture = isWalking
        ? textureSet.walk[Math.floor((state.timeSeconds + colonist.age * 0.1) * WALK_FRAME_RATE) % textureSet.walk.length]
        : textureSet.idle;
      if (mesh.material.map !== nextFrameTexture) {
        mesh.material.map = nextFrameTexture;
        mesh.material.needsUpdate = true;
      }

      mesh.position.x = colonist.position.x;
      mesh.position.z = colonist.position.z;
      mesh.position.y = 0.01 + Math.abs(Math.sin((state.timeSeconds + colonist.age * 0.13) * (isWalking ? 9 : 2))) * 0.06;
    }
  }

  render(state) {
    this.syncBuildings(state);
    this.syncColonists(state);
    this.renderer.render(this.scene, this.camera);
  }
}
