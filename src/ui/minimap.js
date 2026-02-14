import { screenToWorldPoint } from '../render/isometricCamera.js';
import { minimapPointToWorld, worldToMinimapPoint } from './minimapGeometry.js';
import {
  drawMinimapColonistDots,
  drawMinimapSelectionRing,
  drawMinimapSquareEntities,
  drawMinimapSurface,
} from './minimapPainter.js';

export class Minimap {
  constructor(canvas, { onCenterRequest } = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: true });
    this.onCenterRequest = onCenterRequest ?? (() => {});
    this.worldRadius = 30;

    this.canvas.addEventListener('click', (event) => {
      const rect = this.canvas.getBoundingClientRect();
      this.onCenterRequest(minimapPointToWorld({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        worldRadius: this.worldRadius,
        width: rect.width,
        height: rect.height,
      }));
    });
  }

  toMinimapX(x) {
    return worldToMinimapPoint({
      x,
      z: 0,
      worldRadius: this.worldRadius,
      width: this.canvas.width,
      height: this.canvas.height,
    }).x;
  }

  toMinimapY(z) {
    return worldToMinimapPoint({
      x: 0,
      z,
      worldRadius: this.worldRadius,
      width: this.canvas.width,
      height: this.canvas.height,
    }).y;
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
    const point = worldToMinimapPoint({
      x: cameraState.centerX ?? 0,
      z: cameraState.centerZ ?? 0,
      worldRadius: this.worldRadius,
      width: this.canvas.width,
      height: this.canvas.height,
    });
    const x = point.x;
    const y = point.y;
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
    drawMinimapSurface(this.ctx, this.canvas.width, this.canvas.height);

    const projectBuilding = (building) => worldToMinimapPoint({
      x: building.x,
      z: building.z,
      worldRadius: this.worldRadius,
      width: this.canvas.width,
      height: this.canvas.height,
    });
    drawMinimapSquareEntities(this.ctx, state.buildings, {
      project: projectBuilding,
      color: '#e6ccb2',
    });
    drawMinimapSquareEntities(this.ctx, state.constructionQueue, {
      project: projectBuilding,
      color: '#d8a65f',
    });
    drawMinimapColonistDots(this.ctx, state.colonists, {
      project: (colonist) => worldToMinimapPoint({
        x: colonist.position.x,
        z: colonist.position.z,
        worldRadius: this.worldRadius,
        width: this.canvas.width,
        height: this.canvas.height,
      }),
    });
    drawMinimapSelectionRing(this.ctx, selectedEntity, {
      project: (entity) => worldToMinimapPoint({
        x: entity.x ?? 0,
        z: entity.z ?? 0,
        worldRadius: this.worldRadius,
        width: this.canvas.width,
        height: this.canvas.height,
      }),
    });

    if (cameraState?.projection === 'isometric') {
      this.drawViewport(cameraState);
    } else {
      this.drawCameraCenter(cameraState);
    }
  }
}

