export function isRectVisibleInViewport({
  x,
  y,
  width,
  height,
  viewportWidth,
  viewportHeight,
  padding = 48,
}) {
  if (x + width < -padding) {
    return false;
  }
  if (y + height < -padding) {
    return false;
  }
  if (x > viewportWidth + padding) {
    return false;
  }
  return y <= viewportHeight + padding;
}

