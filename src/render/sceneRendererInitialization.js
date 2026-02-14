import { defineSceneRendererCallbackProperties } from './sceneRendererProperties.js';
import { normalizeRendererMode, readRendererModePreference } from './rendererModePreference.js';

export function initializeSceneRenderer(
  renderer,
  {
    rootElement,
    normalizeMode = normalizeRendererMode,
    readModePreference = readRendererModePreference,
    defineCallbackProperties = defineSceneRendererCallbackProperties,
  },
) {
  renderer.rootElement = rootElement;
  renderer._onGroundClick = null;
  renderer._onPlacementPreview = null;
  renderer._onEntitySelect = null;
  renderer.preview = null;
  renderer.mode = normalizeMode(readModePreference() ?? 'isometric');
  renderer.activeRenderer = null;
  renderer.lastState = null;

  defineCallbackProperties(renderer);
  renderer.initializeRenderer(renderer.mode);
}

