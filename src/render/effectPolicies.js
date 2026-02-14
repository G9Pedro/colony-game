const INDUSTRIAL_TYPES = new Set(['workshop', 'ironMine']);
const MYSTIC_TYPES = new Set(['shrine', 'library']);

export function shouldEmitIndustrialSmoke(buildingType, randomValue, smokeRate) {
  return INDUSTRIAL_TYPES.has(buildingType) && randomValue < smokeRate;
}

export function shouldEmitMysticSparkle(buildingType, randomValue, smokeRate) {
  return MYSTIC_TYPES.has(buildingType) && randomValue < smokeRate * 0.5;
}

export function createIndustrialSmokeBurst(building, qualityMultiplier) {
  return {
    x: building.x + 0.3,
    z: building.z - 0.2,
    kind: 'smoke',
    count: Math.max(1, Math.round(2 * qualityMultiplier)),
    color: 'rgba(185, 188, 196, 0.45)',
  };
}

export function createMysticSparkleBurst(building) {
  return {
    x: building.x,
    z: building.z,
    kind: 'sparkle',
    count: 1,
    color: 'rgba(253, 235, 177, 0.65)',
  };
}

