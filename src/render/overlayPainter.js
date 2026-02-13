export function drawBackgroundLayer(ctx, width, height, daylight) {
  const skyGradient = ctx.createLinearGradient(0, 0, 0, height);
  skyGradient.addColorStop(0, daylight > 0.42 ? '#89c5f2' : '#2f466f');
  skyGradient.addColorStop(1, daylight > 0.42 ? '#dfd2ad' : '#4d4b5f');
  ctx.fillStyle = skyGradient;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = daylight > 0.42 ? 'rgba(84, 126, 67, 0.24)' : 'rgba(42, 56, 70, 0.33)';
  ctx.beginPath();
  ctx.moveTo(0, height * 0.38);
  ctx.bezierCurveTo(width * 0.2, height * 0.32, width * 0.44, height * 0.43, width * 0.62, height * 0.34);
  ctx.bezierCurveTo(width * 0.75, height * 0.3, width * 0.88, height * 0.39, width, height * 0.31);
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fill();
}

export function drawPlacementPreview(ctx, camera, preview) {
  if (!preview) {
    return;
  }
  const screen = camera.worldToScreen(preview.x, preview.z);
  const width = camera.tileWidth * camera.zoom;
  const height = camera.tileHeight * camera.zoom;
  const color = preview.valid ? 'rgba(60, 173, 91, 0.78)' : 'rgba(207, 86, 71, 0.78)';

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(screen.x, screen.y - height * 0.5);
  ctx.lineTo(screen.x + width * 0.5, screen.y);
  ctx.lineTo(screen.x, screen.y + height * 0.5);
  ctx.lineTo(screen.x - width * 0.5, screen.y);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

export function drawSelectionHighlight(ctx, camera, entity, pulseAlpha) {
  if (!entity) {
    return;
  }
  ctx.save();
  if (entity.type === 'building') {
    const screen = camera.worldToScreen(entity.x, entity.z);
    const width = camera.tileWidth * camera.zoom * 1.35;
    const height = camera.tileHeight * camera.zoom * 0.8;
    ctx.strokeStyle = `rgba(244, 219, 152, ${pulseAlpha})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(screen.x, screen.y - height * 0.5);
    ctx.lineTo(screen.x + width * 0.5, screen.y);
    ctx.lineTo(screen.x, screen.y + height * 0.5);
    ctx.lineTo(screen.x - width * 0.5, screen.y);
    ctx.closePath();
    ctx.stroke();
  } else if (entity.type === 'colonist') {
    const screen = camera.worldToScreen(entity.x, entity.z);
    ctx.strokeStyle = `rgba(245, 227, 173, ${pulseAlpha})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(screen.x, screen.y + 8 * camera.zoom, 9 * camera.zoom, 4.5 * camera.zoom, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawTimeAndSeasonOverlays(ctx, width, height, nightFactor, seasonTint) {
  if (nightFactor > 0.05) {
    ctx.fillStyle = `rgba(19, 28, 59, ${nightFactor * 0.35})`;
    ctx.fillRect(0, 0, width, height);
  }
  ctx.fillStyle = seasonTint;
  ctx.fillRect(0, 0, width, height);
}

