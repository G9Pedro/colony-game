export const RENDERER_MODE_STORAGE_KEY = 'colony-frontier-renderer-mode';

export function normalizeRendererMode(mode) {
  return mode === 'three' ? 'three' : 'isometric';
}

function resolveStorage(storage) {
  if (storage) {
    return storage;
  }
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  return null;
}

export function readRendererModePreference(storage) {
  const targetStorage = resolveStorage(storage);
  if (!targetStorage) {
    return null;
  }
  try {
    return targetStorage.getItem(RENDERER_MODE_STORAGE_KEY);
  } catch (error) {
    return null;
  }
}

export function persistRendererModePreference(mode, storage) {
  const targetStorage = resolveStorage(storage);
  if (!targetStorage) {
    return false;
  }
  const normalizedMode = normalizeRendererMode(mode);
  try {
    targetStorage.setItem(RENDERER_MODE_STORAGE_KEY, normalizedMode);
    return true;
  } catch (error) {
    return false;
  }
}

