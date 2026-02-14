export function toggleBuildSelection(currentSelectedType, requestedType) {
  return currentSelectedType === requestedType ? null : requestedType;
}

export function buildUiControllerHudState({
  state,
  renderer,
  formatRenderStatsLabel,
  getStatusBannerMessage,
}) {
  const rendererMode = renderer?.getRendererMode?.() ?? 'isometric';
  const renderStats = renderer?.getDebugStats?.();
  const renderStatsLabel = formatRenderStatsLabel(renderStats);
  const bannerMessage = getStatusBannerMessage(state.status);
  return {
    scenarioId: state.scenarioId,
    balanceProfileId: state.balanceProfileId,
    rendererMode,
    renderStatsLabel,
    bannerMessage,
  };
}

