import { normalizeRendererMode } from './rendererModePreference.js';

export function dispatchSceneRendererModeChange(renderer, mode, deps = {}) {
  const normalizeMode = deps.normalizeMode ?? normalizeRendererMode;
  const normalizedMode = normalizeMode(mode);
  if (normalizedMode === renderer.mode) {
    return true;
  }
  renderer.initializeRenderer(normalizedMode);
  return renderer.mode === normalizedMode;
}

export function getSceneRendererMode(renderer) {
  return renderer.mode;
}

