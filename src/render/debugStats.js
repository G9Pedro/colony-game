function toFiniteNumber(value, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}

function toNonNegativeInteger(value, fallback = 0) {
  return Math.max(0, Math.round(toFiniteNumber(value, fallback)));
}

export function normalizeRendererMode(mode, fallback = 'isometric') {
  if (mode === 'three') {
    return 'three';
  }
  if (mode === 'isometric') {
    return 'isometric';
  }
  return fallback === 'three' ? 'three' : 'isometric';
}

export function normalizeDebugStats(stats, fallbackMode = 'isometric') {
  const mode = normalizeRendererMode(stats?.mode, fallbackMode);
  if (!stats || typeof stats !== 'object') {
    return {
      mode,
      fps: 0,
      quality: null,
      particles: 0,
      particleCap: 0,
    };
  }

  const quality = Number.isFinite(stats.quality)
    ? Math.max(0, Math.min(1, stats.quality))
    : null;

  return {
    mode,
    fps: Math.max(0, toFiniteNumber(stats.fps, 0)),
    quality,
    particles: toNonNegativeInteger(stats.particles, 0),
    particleCap: toNonNegativeInteger(stats.particleCap, 0),
  };
}

export function createDebugStats(payload) {
  return normalizeDebugStats(payload, payload?.mode ?? 'isometric');
}

