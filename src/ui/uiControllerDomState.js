export function applyHudStateToElements(elements, hudState) {
  elements.scenarioSelect.value = hudState.scenarioId;
  elements.balanceProfileSelect.value = hudState.balanceProfileId;
  elements.rendererModeSelect.value = hudState.rendererMode;
  elements.renderStatsLabel.textContent = hudState.renderStatsLabel;
}

export function syncBannerState({ bannerMessage, showBanner, hideBanner }) {
  if (bannerMessage) {
    showBanner(bannerMessage);
    return 'shown';
  }
  hideBanner();
  return 'hidden';
}

