export function buildClockLabel({ day, paused, speed }) {
  return `Day ${day} · ${paused ? 'Paused' : `${speed}x`}`;
}

export function buildPauseButtonLabel(paused) {
  return paused ? '▶ Resume' : '⏸ Pause';
}

export function buildSpeedButtonStates(activeSpeed, speedValues = [1, 2, 4]) {
  return speedValues.map((speed) => ({
    speed,
    active: speed === activeSpeed,
  }));
}

