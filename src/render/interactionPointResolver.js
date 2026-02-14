export function mapClientToLocalPoint(clientX, clientY, rect) {
  return {
    x: clientX - rect.left,
    y: clientY - rect.top,
  };
}

export function resolveInteractionPoint({
  camera,
  canvas,
  clientX,
  clientY,
}) {
  const rect = canvas.getBoundingClientRect();
  const local = mapClientToLocalPoint(clientX, clientY, rect);
  return {
    local,
    world: camera.screenToWorld(local.x, local.y),
    tile: camera.screenToTile(local.x, local.y),
  };
}

