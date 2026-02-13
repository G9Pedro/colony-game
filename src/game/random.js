const UINT32_MAX_PLUS_ONE = 0x100000000;

export function seedFromString(input) {
  const value = String(input ?? 'colony-default');
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function nextRandom(state) {
  state.rngState = (Math.imul(1664525, state.rngState) + 1013904223) >>> 0;
  return state.rngState / UINT32_MAX_PLUS_ONE;
}

export function randomBetween(state, min, max) {
  return min + (max - min) * nextRandom(state);
}
