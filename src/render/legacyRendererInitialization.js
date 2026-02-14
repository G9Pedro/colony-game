import { createLegacyRendererBaseState } from './legacyRendererBaseState.js';
import { createLegacyRendererRuntime } from './legacyRendererRuntime.js';
import { applyLegacyRendererRuntimeState } from './legacyRendererRuntimeState.js';

export function initializeLegacyThreeRenderer(
  renderer,
  {
    rootElement,
    three,
    performanceObject,
    windowObject,
    maxPixelRatio = 2,
    createBaseState = createLegacyRendererBaseState,
    createRuntime = createLegacyRendererRuntime,
    applyRuntimeState = applyLegacyRendererRuntimeState,
  },
) {
  Object.assign(renderer, createBaseState({
    rootElement,
    three,
    performanceObject,
  }));

  const runtime = createRuntime({
    rootElement,
    scene: renderer.scene,
    three,
    windowObject,
    maxPixelRatio,
  });
  applyRuntimeState(renderer, runtime);

  renderer.updateCamera();
  renderer.resize();
  renderer.bindEvents();
}

