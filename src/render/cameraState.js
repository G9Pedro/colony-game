const DEFAULT_CAMERA_STATE = {
  mode: 'isometric',
  projection: 'isometric',
  centerX: 0,
  centerZ: 0,
  zoom: 1,
  width: 1,
  height: 1,
  tileWidth: 64,
  tileHeight: 32,
  worldRadius: 30,
};

function toFiniteNumber(value, fallback) {
  return Number.isFinite(value) ? value : fallback;
}

function toPositiveNumber(value, fallback) {
  return Math.max(0.0001, toFiniteNumber(value, fallback));
}

function normalizeRendererMode(mode, fallback = DEFAULT_CAMERA_STATE.mode) {
  if (mode === 'three') {
    return 'three';
  }
  if (mode === 'isometric') {
    return 'isometric';
  }
  return fallback === 'three' ? 'three' : 'isometric';
}

function normalizeProjection(projection, fallback = DEFAULT_CAMERA_STATE.projection) {
  if (projection === 'perspective') {
    return 'perspective';
  }
  if (projection === 'isometric') {
    return 'isometric';
  }
  return fallback === 'perspective' ? 'perspective' : 'isometric';
}

export function normalizeCameraState(cameraState, defaults = {}) {
  const fallbackMode = normalizeRendererMode(defaults.mode, DEFAULT_CAMERA_STATE.mode);
  const fallbackProjection = normalizeProjection(defaults.projection, DEFAULT_CAMERA_STATE.projection);

  if (!cameraState || typeof cameraState !== 'object') {
    return {
      ...DEFAULT_CAMERA_STATE,
      mode: fallbackMode,
      projection: fallbackProjection,
    };
  }

  const mode = normalizeRendererMode(cameraState.mode, fallbackMode);
  const projection = normalizeProjection(cameraState.projection, fallbackProjection);
  const normalized = {
    mode,
    projection,
    centerX: toFiniteNumber(cameraState.centerX, DEFAULT_CAMERA_STATE.centerX),
    centerZ: toFiniteNumber(cameraState.centerZ, DEFAULT_CAMERA_STATE.centerZ),
    zoom: toPositiveNumber(cameraState.zoom, DEFAULT_CAMERA_STATE.zoom),
    width: toPositiveNumber(cameraState.width, DEFAULT_CAMERA_STATE.width),
    height: toPositiveNumber(cameraState.height, DEFAULT_CAMERA_STATE.height),
    worldRadius: toPositiveNumber(cameraState.worldRadius, DEFAULT_CAMERA_STATE.worldRadius),
    tileWidth: null,
    tileHeight: null,
  };

  if (projection === 'isometric') {
    normalized.tileWidth = toPositiveNumber(cameraState.tileWidth, DEFAULT_CAMERA_STATE.tileWidth);
    normalized.tileHeight = toPositiveNumber(cameraState.tileHeight, DEFAULT_CAMERA_STATE.tileHeight);
  }

  return normalized;
}

