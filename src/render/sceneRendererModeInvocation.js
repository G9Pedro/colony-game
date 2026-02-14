export function buildSceneRendererModeInitializationInvocation({
  renderer,
  mode,
  createIsometricRenderer,
  createThreeRenderer,
  persistRendererMode,
}) {
  return {
    activeRenderer: renderer.activeRenderer,
    mode,
    rootElement: renderer.rootElement,
    createIsometricRenderer,
    createThreeRenderer,
    persistRendererMode,
    sessionPayload: {
      onGroundClick: renderer._onGroundClick,
      onPlacementPreview: renderer._onPlacementPreview,
      onEntitySelect: renderer._onEntitySelect,
      preview: renderer.preview,
      lastState: renderer.lastState,
    },
  };
}

