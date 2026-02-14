const DEFAULT_TILE_WIDTH = 64;
const DEFAULT_TILE_HEIGHT = 32;

export function getIsometricTilePixelScale({
  zoom,
  tileWidth = DEFAULT_TILE_WIDTH,
  tileHeight = DEFAULT_TILE_HEIGHT,
}) {
  return {
    halfW: (tileWidth * zoom) * 0.5,
    halfH: (tileHeight * zoom) * 0.5,
  };
}

export function worldToScreenPoint({
  x,
  z,
  centerX,
  centerZ,
  width,
  height,
  zoom,
  tileWidth = DEFAULT_TILE_WIDTH,
  tileHeight = DEFAULT_TILE_HEIGHT,
}) {
  const { halfW, halfH } = getIsometricTilePixelScale({
    zoom,
    tileWidth,
    tileHeight,
  });
  const isoX = (x - centerX) - (z - centerZ);
  const isoY = (x - centerX) + (z - centerZ);
  return {
    x: width * 0.5 + isoX * halfW,
    y: height * 0.5 + isoY * halfH,
  };
}

export function screenToWorldPoint({
  screenX,
  screenY,
  centerX,
  centerZ,
  width,
  height,
  zoom,
  tileWidth = DEFAULT_TILE_WIDTH,
  tileHeight = DEFAULT_TILE_HEIGHT,
}) {
  const { halfW, halfH } = getIsometricTilePixelScale({
    zoom,
    tileWidth,
    tileHeight,
  });
  if (halfW <= 0 || halfH <= 0) {
    return { x: centerX, z: centerZ };
  }

  const isoX = (screenX - width * 0.5) / halfW;
  const isoY = (screenY - height * 0.5) / halfH;
  const worldDeltaX = (isoY + isoX) * 0.5;
  const worldDeltaZ = (isoY - isoX) * 0.5;
  return {
    x: centerX + worldDeltaX,
    z: centerZ + worldDeltaZ,
  };
}

export function screenDeltaToWorldDelta({
  deltaX,
  deltaY,
  zoom,
  tileWidth = DEFAULT_TILE_WIDTH,
  tileHeight = DEFAULT_TILE_HEIGHT,
}) {
  const { halfW, halfH } = getIsometricTilePixelScale({
    zoom,
    tileWidth,
    tileHeight,
  });
  if (halfW <= 0 || halfH <= 0) {
    return null;
  }
  const isoDeltaX = deltaX / halfW;
  const isoDeltaY = deltaY / halfH;
  return {
    worldDeltaX: (isoDeltaY + isoDeltaX) * 0.5,
    worldDeltaZ: (isoDeltaY - isoDeltaX) * 0.5,
  };
}

