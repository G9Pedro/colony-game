import { createIsometricRendererRuntime } from './isometricRendererRuntime.js';
import { createIsometricInteractionSession } from './isometricInteractionSession.js';

export function initializeIsometricRenderer(
  renderer,
  {
    rootElement,
    options = {},
    documentObject,
    performanceObject,
    windowObject,
    createRuntime = createIsometricRendererRuntime,
    createInteractionSession = createIsometricInteractionSession,
  },
) {
  renderer.rootElement = rootElement;
  renderer.onGroundClick = null;
  renderer.onPlacementPreview = null;
  renderer.onEntitySelect = null;

  Object.assign(renderer, createRuntime({
    rootElement,
    options,
    documentObject,
    performanceObject,
  }));

  renderer.interactionController = createInteractionSession({ renderer });

  renderer.boundResize = () => renderer.resize();
  windowObject.addEventListener('resize', renderer.boundResize);

  renderer.resize();
}

