export function renderGameUITopState({
  elements,
  state,
  populationText,
  morale,
  storageText,
  buildClockLabel,
  buildPauseButtonLabel,
}) {
  elements.clockLabel.textContent = buildClockLabel(state);
  elements.statusLabel.textContent = state.status;
  elements.dayLabel.textContent = String(state.day);
  elements.populationLabel.textContent = populationText;
  elements.moraleLabel.textContent = morale;
  elements.storageLabel.textContent = storageText;
  elements.pauseBtn.textContent = buildPauseButtonLabel(state.paused);
}

export function renderGameUISpeedButtons({ elements, speed, buildSpeedButtonStates }) {
  const speedStates = buildSpeedButtonStates(speed);
  elements.speedButtons.forEach((button, index) => {
    button.classList.toggle('active', !!speedStates[index]?.active);
  });
}

