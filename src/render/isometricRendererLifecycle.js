export function resizeIsometricViewport({
  rootElement,
  canvas,
  ctx,
  camera,
  terrainLayer,
  windowObject = window,
  maxPixelRatio = 2,
}) {
  const width = Math.max(1, rootElement.clientWidth);
  const height = Math.max(1, rootElement.clientHeight);
  const dpr = Math.min(windowObject.devicePixelRatio || 1, maxPixelRatio);

  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);
  camera.setViewport(width, height);
  terrainLayer.resize(width, height, dpr);

  return {
    width,
    height,
    dpr,
  };
}

export function disposeIsometricRenderer({
  windowObject = window,
  boundResize,
  interactionController,
  canvas,
  clearInteractiveEntities,
  clearTerrainLayer,
}) {
  windowObject.removeEventListener('resize', boundResize);
  interactionController.dispose();
  canvas.remove();
  clearInteractiveEntities();
  clearTerrainLayer();
}

