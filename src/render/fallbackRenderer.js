import { BUILDING_DEFINITIONS } from '../content/buildings.js';
import { BUILDING_ICON_ASSETS, SCENE_ASSETS, getColonistSpriteAssetSet } from '../assets/manifest.js';

const WALK_FRAME_RATE = 9;

function drawImageAtFeet(ctx, image, x, y, width, height) {
  if (!image.complete || image.naturalWidth <= 0 || image.naturalHeight <= 0) {
    return false;
  }
  ctx.drawImage(image, x - width / 2, y - height, width, height);
  return true;
}

export class FallbackRenderer {
  constructor(rootElement) {
    this.rootElement = rootElement;
    this.onGroundClick = null;
    this.onPlacementPreview = null;
    this.preview = null;
    this.images = new Map();
    this.colonistAnimationState = new Map();

    this.canvas = document.createElement('canvas');
    this.canvas.width = rootElement.clientWidth;
    this.canvas.height = rootElement.clientHeight;
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.display = 'block';
    rootElement.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');

    this.backgroundImages = {
      sky: this.getImage(SCENE_ASSETS.sky),
      ground: this.getImage(SCENE_ASSETS.ground),
      grid: this.getImage(SCENE_ASSETS.grid),
    };
    this.buildingImages = new Map();
    Object.entries(BUILDING_ICON_ASSETS).forEach(([buildingType, assetPath]) => {
      this.buildingImages.set(buildingType, this.getImage(assetPath));
    });
    this.colonistSpriteSets = {
      default: this.createColonistSpriteSet('laborer'),
      builder: this.createColonistSpriteSet('builder'),
    };

    this.canvas.addEventListener('click', (event) => {
      const point = this.screenToWorld(event.clientX, event.clientY);
      this.onGroundClick?.(point);
    });
    this.canvas.addEventListener('mousemove', (event) => {
      const point = this.screenToWorld(event.clientX, event.clientY);
      this.onPlacementPreview?.(point);
    });

    window.addEventListener('resize', () => this.resize());
    this.resize();
  }

  resize() {
    this.canvas.width = this.rootElement.clientWidth;
    this.canvas.height = this.rootElement.clientHeight;
  }

  getImage(url) {
    if (this.images.has(url)) {
      return this.images.get(url);
    }
    const image = new Image();
    image.decoding = 'async';
    image.src = url;
    this.images.set(url, image);
    return image;
  }

  createColonistSpriteSet(job) {
    const spriteAssets = getColonistSpriteAssetSet(job);
    return {
      key: spriteAssets.key,
      idle: this.getImage(spriteAssets.idle),
      walk: spriteAssets.walk.map((assetPath) => this.getImage(assetPath)),
    };
  }

  getColonistSpriteSet(job) {
    return job === 'builder' ? this.colonistSpriteSets.builder : this.colonistSpriteSets.default;
  }

  screenToWorld(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const normalizedX = (clientX - rect.left) / rect.width;
    const normalizedY = (clientY - rect.top) / rect.height;
    return {
      x: (normalizedX - 0.5) * 54,
      z: (normalizedY - 0.5) * 54,
    };
  }

  setGroundClickHandler(handler) {
    this.onGroundClick = handler;
  }

  setPlacementPreviewHandler(handler) {
    this.onPlacementPreview = handler;
  }

  updatePlacementMarker(position, valid) {
    if (!position) {
      this.preview = null;
      return;
    }
    this.preview = { ...position, valid };
  }

  worldToCanvas(x, z) {
    return {
      x: this.canvas.width * (x / 54 + 0.5),
      y: this.canvas.height * (z / 54 + 0.5),
    };
  }

  drawBackground(ctx) {
    const sky = this.backgroundImages.sky;
    if (sky.complete && sky.naturalWidth > 0 && sky.naturalHeight > 0) {
      ctx.drawImage(sky, 0, 0, this.canvas.width, this.canvas.height);
    } else {
      ctx.fillStyle = '#07223d';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    const ground = this.backgroundImages.ground;
    if (ground.complete && ground.naturalWidth > 0 && ground.naturalHeight > 0) {
      const pattern = ctx.createPattern(ground, 'repeat');
      if (pattern) {
        ctx.save();
        ctx.globalAlpha = 0.86;
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.restore();
      }
    }

    const grid = this.backgroundImages.grid;
    if (grid.complete && grid.naturalWidth > 0 && grid.naturalHeight > 0) {
      ctx.save();
      ctx.globalAlpha = 0.2;
      ctx.drawImage(grid, 0, 0, this.canvas.width, this.canvas.height);
      ctx.restore();
    }
  }

  render(state) {
    const { ctx } = this;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawBackground(ctx);

    for (const building of state.buildings) {
      const p = this.worldToCanvas(building.x, building.z);
      const definition = BUILDING_DEFINITIONS[building.type];
      const buildingImage = this.buildingImages.get(building.type);
      const size = Math.max(26, (definition.size[0] + definition.size[2]) * 5.5);
      const drawn = drawImageAtFeet(ctx, buildingImage, p.x, p.y + 2, size, size);
      if (!drawn) {
        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(p.x - 6, p.y - 6, 12, 12);
      }
    }

    const aliveColonistIds = new Set();
    for (const colonist of state.colonists) {
      if (!colonist.alive) {
        continue;
      }
      aliveColonistIds.add(colonist.id);
      const p = this.worldToCanvas(colonist.position.x, colonist.position.z);
      const spriteSet = this.getColonistSpriteSet(colonist.job);
      const animationState = this.colonistAnimationState.get(colonist.id) ?? {
        setKey: spriteSet.key,
        lastX: colonist.position.x,
        lastZ: colonist.position.z,
      };
      const movementDelta = Math.hypot(
        colonist.position.x - animationState.lastX,
        colonist.position.z - animationState.lastZ,
      );
      animationState.lastX = colonist.position.x;
      animationState.lastZ = colonist.position.z;
      if (animationState.setKey !== spriteSet.key) {
        animationState.setKey = spriteSet.key;
      }

      this.colonistAnimationState.set(colonist.id, animationState);
      const isWalking = movementDelta > 0.002;
      const frame = isWalking
        ? spriteSet.walk[Math.floor((state.timeSeconds + colonist.age * 0.1) * WALK_FRAME_RATE) % spriteSet.walk.length]
        : spriteSet.idle;
      const bob = isWalking
        ? Math.abs(Math.sin((state.timeSeconds + colonist.age * 0.15) * 10)) * 2.2
        : Math.abs(Math.sin((state.timeSeconds + colonist.age * 0.15) * 2)) * 1.1;
      const drawn = drawImageAtFeet(ctx, frame, p.x, p.y + bob, 24, 30);
      if (!drawn) {
        ctx.fillStyle = colonist.job === 'builder' ? '#f59e0b' : '#f97316';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    for (const colonistId of this.colonistAnimationState.keys()) {
      if (!aliveColonistIds.has(colonistId)) {
        this.colonistAnimationState.delete(colonistId);
      }
    }

    if (this.preview) {
      const p = this.worldToCanvas(this.preview.x, this.preview.z);
      ctx.strokeStyle = this.preview.valid ? '#22c55e' : '#ef4444';
      ctx.lineWidth = 2;
      ctx.strokeRect(p.x - 8, p.y - 8, 16, 16);
    }
  }
}
