import { screenToWorldPoint } from '../render/isometricCamera.js';

export function buildMinimapViewportCorners(cameraState, deps = {}) {
  const toWorldPoint = deps.toWorldPoint ?? screenToWorldPoint;
  const { centerX, centerZ, width, height, zoom, tileWidth, tileHeight } = cameraState;

  return [
    toWorldPoint({
      screenX: 0,
      screenY: 0,
      centerX,
      centerZ,
      width,
      height,
      zoom,
      tileWidth,
      tileHeight,
    }),
    toWorldPoint({
      screenX: width,
      screenY: 0,
      centerX,
      centerZ,
      width,
      height,
      zoom,
      tileWidth,
      tileHeight,
    }),
    toWorldPoint({
      screenX: width,
      screenY: height,
      centerX,
      centerZ,
      width,
      height,
      zoom,
      tileWidth,
      tileHeight,
    }),
    toWorldPoint({
      screenX: 0,
      screenY: height,
      centerX,
      centerZ,
      width,
      height,
      zoom,
      tileWidth,
      tileHeight,
    }),
  ];
}

export function drawMinimapViewportOutline(ctx, corners, { projectPoint } = {}) {
  if (!corners.length) {
    return;
  }

  ctx.save();
  ctx.strokeStyle = 'rgba(244, 223, 173, 0.85)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  const firstPoint = projectPoint(corners[0]);
  ctx.moveTo(firstPoint.x, firstPoint.y);
  corners.slice(1).forEach((point) => {
    const projected = projectPoint(point);
    ctx.lineTo(projected.x, projected.y);
  });
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

export function drawMinimapCameraCenterMarker(ctx, cameraState, { projectPoint } = {}) {
  if (!cameraState) {
    return;
  }

  const point = projectPoint({
    x: cameraState.centerX ?? 0,
    z: cameraState.centerZ ?? 0,
  });
  ctx.save();
  ctx.strokeStyle = 'rgba(244, 223, 173, 0.85)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(point.x, point.y, 4.4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(point.x - 2.2, point.y);
  ctx.lineTo(point.x + 2.2, point.y);
  ctx.moveTo(point.x, point.y - 2.2);
  ctx.lineTo(point.x, point.y + 2.2);
  ctx.stroke();
  ctx.restore();
}

