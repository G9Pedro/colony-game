export function runIsometricFrameDraw({
  state,
  frame,
  drawBackground,
  drawTerrain,
  drawEntities,
  drawPreview,
  hoveredEntity,
  selectedEntity,
  drawSelectionOverlay,
  getSelectionPulse,
  drawTimeAndSeasonOverlays,
  ctx,
  getSeasonTint,
}) {
  drawBackground(state, frame.width, frame.height, frame.daylight);
  drawTerrain(state);
  drawEntities(state, frame.now, frame.daylight);
  drawPreview();

  if (hoveredEntity) {
    drawSelectionOverlay(hoveredEntity, getSelectionPulse(frame.now) * 0.75);
  }
  if (selectedEntity) {
    drawSelectionOverlay(selectedEntity, getSelectionPulse(frame.now));
  }

  drawTimeAndSeasonOverlays(
    ctx,
    frame.width,
    frame.height,
    1 - frame.daylight,
    getSeasonTint(state.day),
  );
}

