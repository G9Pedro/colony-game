function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function getDaylightFactor(timeSeconds = 0) {
  const cycleHour = ((timeSeconds % 24) + 24) % 24;
  const dayCycle = cycleHour / 24;
  return clamp(0.5 + Math.sin(dayCycle * Math.PI * 2 - Math.PI * 0.5) * 0.5, 0, 1);
}

export function getSeasonTint(day = 0) {
  const normalizedDay = Number.isFinite(day) ? day : 0;
  const cycle = ((normalizedDay % 120) + 120) % 120 / 120;
  if (cycle < 0.25) {
    return 'rgba(82, 156, 94, 0.08)';
  }
  if (cycle > 0.6 && cycle < 0.85) {
    return 'rgba(178, 134, 66, 0.1)';
  }
  return 'rgba(0, 0, 0, 0)';
}

export function getResourceGains(resources, previousResources, minimumDelta = 3) {
  if (!resources || !previousResources) {
    return [];
  }
  return Object.entries(resources)
    .map(([key, amount]) => [key, amount - (previousResources[key] ?? amount)])
    .filter(([, delta]) => delta >= minimumDelta)
    .map(([resource, delta]) => ({ resource, delta }));
}

