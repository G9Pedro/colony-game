const FALLBACK_RENDERER_OPTIONS = Object.freeze({
  quality: 'low',
  effectsEnabled: false,
  cameraTileWidth: 58,
  cameraTileHeight: 29,
});

export function getFallbackRendererOptions() {
  return { ...FALLBACK_RENDERER_OPTIONS };
}

export function createFallbackRendererDelegate({
  rootElement,
  createIsometricRenderer,
  options = getFallbackRendererOptions(),
}) {
  return createIsometricRenderer(rootElement, options);
}

