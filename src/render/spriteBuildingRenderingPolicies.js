export function resolveBuildingSurfaceColors(override = {}) {
  return {
    roofColor: override.roof ?? '#9a5f3b',
    wallColor: override.wall ?? '#a18b73',
  };
}

export function resolveBuildingNoiseStrength(quality = 'balanced') {
  return quality === 'high' ? 0.2 : 0.09;
}

export function buildBuildingSpriteMetrics({ centerX, baseY, width, depth }) {
  return {
    anchorX: centerX,
    anchorY: baseY + depth * 0.5 + 2,
    width,
    depth,
  };
}

