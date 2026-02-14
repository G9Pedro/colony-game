import { disposeIsometricRenderer, resizeIsometricViewport } from './isometricRendererLifecycle.js';

export function dispatchIsometricResize(renderer, deps = {}) {
  const resizeViewport = deps.resizeViewport ?? resizeIsometricViewport;
  const windowObject = deps.windowObject ?? window;
  const maxPixelRatio = deps.maxPixelRatio ?? 2;

  const viewport = resizeViewport({
    rootElement: renderer.rootElement,
    canvas: renderer.canvas,
    ctx: renderer.ctx,
    camera: renderer.camera,
    terrainLayer: renderer.terrainLayer,
    windowObject,
    maxPixelRatio,
  });
  renderer.devicePixelRatio = viewport.dpr;
  return viewport;
}

export function dispatchIsometricDispose(renderer, deps = {}) {
  const disposeRenderer = deps.disposeRenderer ?? disposeIsometricRenderer;
  const windowObject = deps.windowObject ?? window;

  disposeRenderer({
    windowObject,
    boundResize: renderer.boundResize,
    interactionController: renderer.interactionController,
    canvas: renderer.canvas,
    clearInteractiveEntities: () => {
      renderer.interactiveEntities = [];
    },
    clearTerrainLayer: () => {
      renderer.terrainLayer = null;
    },
  });

  renderer.interactionController = null;
}

