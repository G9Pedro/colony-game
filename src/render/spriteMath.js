export function shadeColor(hexColor, factor) {
  const normalized = hexColor.replace('#', '');
  const value = Number.parseInt(normalized, 16);
  const r = Math.max(0, Math.min(255, Math.floor(((value >> 16) & 0xff) * factor)));
  const g = Math.max(0, Math.min(255, Math.floor(((value >> 8) & 0xff) * factor)));
  const b = Math.max(0, Math.min(255, Math.floor((value & 0xff) * factor)));
  return `rgb(${r} ${g} ${b})`;
}

export function hash2d(x, z, salt = 0) {
  const value = Math.sin((x + 17.23 + salt) * 12.9898 + (z - 3.11 - salt) * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

