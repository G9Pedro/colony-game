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
  return validateSaveState(value).ok;
}

export function validateSaveState(value) {
  const errors = [];
  if (!value || typeof value !== 'object') {
    return { ok: false, errors: ['Save payload must be an object.'] };
  }

  if (typeof value.tick !== 'number') {
    errors.push('Missing or invalid tick.');
  }
  if (typeof value.timeSeconds !== 'number') {
    errors.push('Missing or invalid timeSeconds.');
  }
  if (!value.resources || typeof value.resources !== 'object') {
    errors.push('Missing resources map.');
  }
  if (!Array.isArray(value.colonists)) {
    errors.push('Missing colonists array.');
  }
  if (!Array.isArray(value.buildings)) {
    errors.push('Missing buildings array.');
  }
  if (!value.research || typeof value.research !== 'object') {
    errors.push('Missing research state.');
  }
  if (value.research && !Array.isArray(value.research.completed)) {
    errors.push('Research completed list is invalid.');
  }
  if (value.rules && typeof value.rules !== 'object') {
    errors.push('Rules payload must be an object.');
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}
