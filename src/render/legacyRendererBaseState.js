export function createLegacyRendererBaseState({
  rootElement,
  three,
  performanceObject = performance,
}) {
  const scene = new three.Scene();
  scene.background = new three.Color(0x9ad6f7);

  return {
    rootElement,
    onGroundClick: null,
    onPlacementPreview: null,
    onEntitySelect: null,
    lastFrameAt: performanceObject.now(),
    smoothedFps: 60,
    scene,
  };
}

