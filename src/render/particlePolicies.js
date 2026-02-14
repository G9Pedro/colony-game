export function clampParticleValue(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function resolveParticleQualityBudgets({
  baseMaxParticles,
  baseMaxFloatingText,
  qualityMultiplier = 1,
  minimumParticles = 120,
  minimumFloatingText = 24,
}) {
  const clampedMultiplier = clampParticleValue(qualityMultiplier, 0.35, 1);
  return {
    maxParticles: Math.max(minimumParticles, Math.floor(baseMaxParticles * clampedMultiplier)),
    maxFloatingText: Math.max(minimumFloatingText, Math.floor(baseMaxFloatingText * clampedMultiplier)),
  };
}

export function resolveParticleLifetime(kind = 'dust') {
  if (kind === 'smoke') {
    return 1.7;
  }
  if (kind === 'sparkle') {
    return 1;
  }
  return 0.75;
}

export function resolveParticleDrag(kind = 'dust') {
  return kind === 'smoke' ? 0.3 : 0.5;
}

export function resolveParticleSize(kind, sampleBetween) {
  if (kind === 'sparkle') {
    return sampleBetween(1.2, 2.5);
  }
  return sampleBetween(2, 4);
}

export function resolveFloatingTextFontSize(zoom, {
  minimum = 10,
  base = 14,
} = {}) {
  return Math.max(minimum, Math.floor(base * zoom));
}
