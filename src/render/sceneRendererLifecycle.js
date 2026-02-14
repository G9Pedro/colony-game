import { normalizeRendererMode } from './rendererModePreference.js';

export function instantiateSceneRenderer({
  mode,
  rootElement,
  createIsometricRenderer,
  createThreeRenderer,
}) {
  const normalizedMode = normalizeRendererMode(mode);
  try {
    if (normalizedMode === 'three') {
      return {
        mode: 'three',
        renderer: createThreeRenderer(rootElement),
      };
    }
    return {
      mode: 'isometric',
      renderer: createIsometricRenderer(rootElement),
    };
  } catch (error) {
    return {
      mode: 'isometric',
      renderer: createIsometricRenderer(rootElement, {
        quality: 'low',
        effectsEnabled: false,
      }),
    };
  }
}

export function syncSceneRendererSession(renderer, {
  onGroundClick,
  onPlacementPreview,
  onEntitySelect,
  preview,
  lastState,
}) {
  renderer.setGroundClickHandler(onGroundClick);
  renderer.setPlacementPreviewHandler(onPlacementPreview);
  renderer.setEntitySelectHandler(onEntitySelect);

  if (preview) {
    renderer.updatePlacementMarker(preview.position, preview.valid);
  } else {
    renderer.updatePlacementMarker(null, true);
  }

  if (lastState) {
    renderer.render(lastState);
  }
}

