const NIGHT_WINDOW_BUILDING_TYPES = new Set([
  'house',
  'apartment',
  'library',
  'school',
  'hut',
]);

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function computeConstructionProgress(progress, buildTime) {
  return clamp(progress / Math.max(0.1, buildTime), 0, 1);
}

export function shouldRenderNightWindowGlow(daylight, buildingType) {
  const nightFactor = 1 - daylight;
  if (nightFactor <= 0.45) {
    return false;
  }
  return NIGHT_WINDOW_BUILDING_TYPES.has(buildingType);
}

export function createBuildingInteractiveEntity({
  building,
  screen,
  drawW,
  drawH,
  depth,
}) {
  return {
    entity: {
      type: 'building',
      id: building.id,
      buildingType: building.type,
      x: building.x,
      z: building.z,
    },
    centerX: screen.x,
    centerY: screen.y - drawH * 0.15,
    halfWidth: Math.max(14, drawW * 0.2),
    halfHeight: Math.max(12, drawH * 0.2),
    depth,
  };
}

export function createColonistInteractiveEntity({
  colonist,
  renderState,
  screen,
  drawW,
  drawH,
  depth,
}) {
  return {
    entity: {
      type: 'colonist',
      id: colonist.id,
      colonistId: colonist.id,
      x: renderState.x,
      z: renderState.z,
    },
    centerX: screen.x,
    centerY: screen.y - drawH * 0.2,
    halfWidth: Math.max(8, drawW * 0.35),
    halfHeight: Math.max(10, drawH * 0.5),
    depth,
  };
}

