const STORAGE_KEY = 'colony-frontier-save-v1';

export function serializeState(state) {
  return JSON.stringify(state);
}

export function deserializeState(serialized) {
  return JSON.parse(serialized);
}

export function saveGameState(state) {
  const payload = serializeState(state);
  localStorage.setItem(STORAGE_KEY, payload);
}

export function loadGameState() {
  const payload = localStorage.getItem(STORAGE_KEY);
  if (!payload) {
    return null;
  }
  return deserializeState(payload);
}

export function clearSavedGame() {
  localStorage.removeItem(STORAGE_KEY);
}

export function isLikelyValidState(value) {
  return Boolean(
    value &&
      typeof value === 'object' &&
      typeof value.tick === 'number' &&
      typeof value.timeSeconds === 'number' &&
      value.resources &&
      value.colonists &&
      value.buildings &&
      value.research,
  );
}
