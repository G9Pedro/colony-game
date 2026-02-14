export function defineSceneRendererCallbackProperties(renderer) {
  Object.defineProperty(renderer, 'onGroundClick', {
    configurable: true,
    enumerable: true,
    get: () => renderer._onGroundClick,
    set: (handler) => renderer.setGroundClickHandler(handler),
  });
  Object.defineProperty(renderer, 'onPlacementPreview', {
    configurable: true,
    enumerable: true,
    get: () => renderer._onPlacementPreview,
    set: (handler) => renderer.setPlacementPreviewHandler(handler),
  });
  Object.defineProperty(renderer, 'onEntitySelect', {
    configurable: true,
    enumerable: true,
    get: () => renderer._onEntitySelect,
    set: (handler) => renderer.setEntitySelectHandler(handler),
  });
}

