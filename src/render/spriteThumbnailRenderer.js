export function buildBuildingThumbnailCrop(sourceCanvas) {
  return {
    sourceX: 22,
    sourceY: 26,
    sourceWidth: sourceCanvas.width - 44,
    sourceHeight: sourceCanvas.height - 34,
  };
}

export function drawBuildingThumbnail(ctx, sourceCanvas, size = 56, deps = {}) {
  const buildCrop = deps.buildCrop ?? buildBuildingThumbnailCrop;
  const crop = buildCrop(sourceCanvas);
  ctx.drawImage(
    sourceCanvas,
    crop.sourceX,
    crop.sourceY,
    crop.sourceWidth,
    crop.sourceHeight,
    0,
    0,
    size,
    size,
  );
}

