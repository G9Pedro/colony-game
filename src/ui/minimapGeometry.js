function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function worldToMinimapPoint({ x, z, worldRadius, width, height }) {
  const safeRadius = Math.max(0.0001, worldRadius);
  const clampedX = clamp(x, -safeRadius, safeRadius);
  const clampedZ = clamp(z, -safeRadius, safeRadius);
  return {
    x: ((clampedX / safeRadius) * 0.5 + 0.5) * width,
    y: ((clampedZ / safeRadius) * 0.5 + 0.5) * height,
  };
}

export function minimapPointToWorld({ x, y, worldRadius, width, height }) {
  const safeRadius = Math.max(0.0001, worldRadius);
  const safeWidth = Math.max(0.0001, width);
  const safeHeight = Math.max(0.0001, height);
  const nx = x / safeWidth;
  const nz = y / safeHeight;
  return {
    x: (nx * 2 - 1) * safeRadius,
    z: (nz * 2 - 1) * safeRadius,
  };
}

