export function createSpriteCanvas(
  width,
  height,
  {
    offscreenCanvasCtor = typeof OffscreenCanvas !== 'undefined' ? OffscreenCanvas : null,
    documentObject = typeof document !== 'undefined' ? document : null,
  } = {},
) {
  if (offscreenCanvasCtor) {
    return new offscreenCanvasCtor(width, height);
  }
  if (!documentObject) {
    throw new Error('A document object is required when OffscreenCanvas is unavailable.');
  }
  const canvas = documentObject.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

export function getSpriteContext2D(canvas) {
  return canvas.getContext('2d', { alpha: true });
}

