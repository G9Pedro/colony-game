import { migrateSaveState, SAVE_SCHEMA_VERSION } from './migrations.js';

const STORAGE_KEY = 'colony-frontier-save-v1';

export function serializeState(state) {
  const payload = JSON.parse(JSON.stringify(state));
  payload.saveMeta = {
    schemaVersion: SAVE_SCHEMA_VERSION,
    savedAt: new Date().toISOString(),
  };
  return JSON.stringify(payload);
}

export function deserializeState(serialized) {
  const parsed = JSON.parse(serialized);
  return migrateSaveState(parsed);
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
