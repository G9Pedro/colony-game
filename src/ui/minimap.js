import { minimapPointToWorld, worldToMinimapPoint } from './minimapGeometry.js';
import {
  buildMinimapViewportCorners,
  drawMinimapCameraCenterMarker,
  drawMinimapViewportOutline,
} from './minimapOverlays.js';
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

  drawViewport(cameraState) {
    if (!cameraState || cameraState.projection !== 'isometric') {
      return;
    }
    const corners = buildMinimapViewportCorners(cameraState);
    drawMinimapViewportOutline(this.ctx, corners, {
      projectPoint: (point) => worldToMinimapPoint({
        x: point.x,
        z: point.z,
        worldRadius: this.worldRadius,
        width: this.canvas.width,
        height: this.canvas.height,
      }),
    });
  }

  drawCameraCenter(cameraState) {
    drawMinimapCameraCenterMarker(this.ctx, cameraState, {
      projectPoint: (point) => worldToMinimapPoint({
        x: point.x,
        z: point.z,
        worldRadius: this.worldRadius,
        width: this.canvas.width,
        height: this.canvas.height,
      }),
    });
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

