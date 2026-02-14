export function createMainRenderer(
  rootElement,
  deps = {},
) {
  const createSceneRenderer = deps.createSceneRenderer;
  const createFallbackRenderer = deps.createFallbackRenderer;
  if (typeof createSceneRenderer !== 'function' || typeof createFallbackRenderer !== 'function') {
    throw new Error('createMainRenderer requires scene and fallback renderer factories.');
  }
  try {
    return {
      renderer: createSceneRenderer(rootElement),
      usingFallbackRenderer: false,
    };
  } catch (error) {
    return {
      renderer: createFallbackRenderer(rootElement),
      usingFallbackRenderer: true,
    };
  }
}
