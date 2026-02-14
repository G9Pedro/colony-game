export function drawMinimapSurface(ctx, width, height) {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#6b5b3d');
  gradient.addColorStop(1, '#4f422d');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = 'rgba(19, 14, 8, 0.55)';
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, width - 1, height - 1);
}

export function drawMinimapSquareEntities(ctx, entries, {
  project,
  color,
  size = 3.6,
} = {}) {
  const halfSize = size / 2;
  entries.forEach((entry) => {
    const point = project(entry);
    ctx.fillStyle = color;
    ctx.fillRect(point.x - halfSize, point.y - halfSize, size, size);
  });
}

export function drawMinimapColonistDots(ctx, colonists, {
  project,
  color = '#9dd4f9',
  radius = 1.2,
} = {}) {
  colonists.forEach((colonist) => {
    if (!colonist.alive) {
      return;
    }
    const point = project(colonist);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
    ctx.fill();
  });
}

export function drawMinimapSelectionRing(ctx, selectedEntity, {
  project,
  color = 'rgba(255, 243, 188, 0.92)',
  radius = 4.2,
  lineWidth = 1.3,
} = {}) {
  if (!selectedEntity) {
    return;
  }
  const point = project(selectedEntity);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
  ctx.stroke();
}

