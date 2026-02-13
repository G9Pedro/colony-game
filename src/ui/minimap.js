import { screenToWorldPoint } from '../render/isometricCamera.js';

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export class Minimap {
  constructor(canvas, { onCenterRequest } = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: true });
    this.onCenterRequest = onCenterRequest ?? (() => {});
    this.worldRadius = 30;

    this.canvas.addEventListener('click', (event) => {
      const rect = this.canvas.getBoundingClientRect();
      const nx = (event.clientX - rect.left) / rect.width;
      const nz = (event.clientY - rect.top) / rect.height;
      const x = (nx * 2 - 1) * this.worldRadius;
      const z = (nz * 2 - 1) * this.worldRadius;
      this.onCenterRequest({ x, z });
    });
  }

  toMinimapX(x) {
    return ((x / this.worldRadius) * 0.5 + 0.5) * this.canvas.width;
  }

  toMinimapY(z) {
    return ((z / this.worldRadius) * 0.5 + 0.5) * this.canvas.height;
  }

  drawViewport(cameraState) {
    if (!cameraState || cameraState.projection !== 'isometric') {
      return;
    }
    const corners = [
      screenToWorldPoint({
        screenX: 0,
        screenY: 0,
        centerX: cameraState.centerX,
        centerZ: cameraState.centerZ,
        width: cameraState.width,
        height: cameraState.height,
        zoom: cameraState.zoom,
        tileWidth: cameraState.tileWidth,
        tileHeight: cameraState.tileHeight,
      }),
      screenToWorldPoint({
        screenX: cameraState.width,
        screenY: 0,
        centerX: cameraState.centerX,
        centerZ: cameraState.centerZ,
        width: cameraState.width,
        height: cameraState.height,
        zoom: cameraState.zoom,
        tileWidth: cameraState.tileWidth,
        tileHeight: cameraState.tileHeight,
      }),
      screenToWorldPoint({
        screenX: cameraState.width,
        screenY: cameraState.height,
        centerX: cameraState.centerX,
        centerZ: cameraState.centerZ,
        width: cameraState.width,
        height: cameraState.height,
        zoom: cameraState.zoom,
        tileWidth: cameraState.tileWidth,
        tileHeight: cameraState.tileHeight,
      }),
      screenToWorldPoint({
        screenX: 0,
        screenY: cameraState.height,
        centerX: cameraState.centerX,
        centerZ: cameraState.centerZ,
        width: cameraState.width,
        height: cameraState.height,
        zoom: cameraState.zoom,
        tileWidth: cameraState.tileWidth,
        tileHeight: cameraState.tileHeight,
      }),
    ];

    this.ctx.save();
    this.ctx.strokeStyle = 'rgba(244, 223, 173, 0.85)';
    this.ctx.lineWidth = 1.5;
    this.ctx.beginPath();
    this.ctx.moveTo(this.toMinimapX(corners[0].x), this.toMinimapY(corners[0].z));
    corners.slice(1).forEach((point) => {
      this.ctx.lineTo(this.toMinimapX(point.x), this.toMinimapY(point.z));
    });
    this.ctx.closePath();
    this.ctx.stroke();
    this.ctx.restore();
  }

  drawCameraCenter(cameraState) {
    if (!cameraState) {
      return;
    }
    const x = this.toMinimapX(clamp(cameraState.centerX ?? 0, -this.worldRadius, this.worldRadius));
    const y = this.toMinimapY(clamp(cameraState.centerZ ?? 0, -this.worldRadius, this.worldRadius));
    this.ctx.save();
    this.ctx.strokeStyle = 'rgba(244, 223, 173, 0.85)';
    this.ctx.lineWidth = 1.2;
    this.ctx.beginPath();
    this.ctx.arc(x, y, 4.4, 0, Math.PI * 2);
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.moveTo(x - 2.2, y);
    this.ctx.lineTo(x + 2.2, y);
    this.ctx.moveTo(x, y - 2.2);
    this.ctx.lineTo(x, y + 2.2);
    this.ctx.stroke();
    this.ctx.restore();
  }

  render(state, cameraState, selectedEntity = null) {
    this.worldRadius = state.maxWorldRadius ?? 30;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#6b5b3d');
    gradient.addColorStop(1, '#4f422d');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.strokeStyle = 'rgba(19, 14, 8, 0.55)';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(0.5, 0.5, this.canvas.width - 1, this.canvas.height - 1);

    state.buildings.forEach((building) => {
      const x = this.toMinimapX(clamp(building.x, -this.worldRadius, this.worldRadius));
      const y = this.toMinimapY(clamp(building.z, -this.worldRadius, this.worldRadius));
      this.ctx.fillStyle = '#e6ccb2';
      this.ctx.fillRect(x - 1.8, y - 1.8, 3.6, 3.6);
    });
    state.constructionQueue.forEach((item) => {
      const x = this.toMinimapX(clamp(item.x, -this.worldRadius, this.worldRadius));
      const y = this.toMinimapY(clamp(item.z, -this.worldRadius, this.worldRadius));
      this.ctx.fillStyle = '#d8a65f';
      this.ctx.fillRect(x - 1.8, y - 1.8, 3.6, 3.6);
    });

    state.colonists.forEach((colonist) => {
      if (!colonist.alive) {
        return;
      }
      const x = this.toMinimapX(clamp(colonist.position.x, -this.worldRadius, this.worldRadius));
      const y = this.toMinimapY(clamp(colonist.position.z, -this.worldRadius, this.worldRadius));
      this.ctx.fillStyle = '#9dd4f9';
      this.ctx.beginPath();
      this.ctx.arc(x, y, 1.2, 0, Math.PI * 2);
      this.ctx.fill();
    });

    if (selectedEntity) {
      const x = this.toMinimapX(clamp(selectedEntity.x ?? 0, -this.worldRadius, this.worldRadius));
      const y = this.toMinimapY(clamp(selectedEntity.z ?? 0, -this.worldRadius, this.worldRadius));
      this.ctx.strokeStyle = 'rgba(255, 243, 188, 0.92)';
      this.ctx.lineWidth = 1.3;
      this.ctx.beginPath();
      this.ctx.arc(x, y, 4.2, 0, Math.PI * 2);
      this.ctx.stroke();
    }

    if (cameraState?.projection === 'isometric') {
      this.drawViewport(cameraState);
    } else {
      this.drawCameraCenter(cameraState);
    }
  }
}

