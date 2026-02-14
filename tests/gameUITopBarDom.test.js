import test from 'node:test';
import assert from 'node:assert/strict';
import { renderGameUISpeedButtons, renderGameUITopState } from '../src/ui/gameUITopBarDom.js';

function createTopBarElements() {
  return {
    clockLabel: { textContent: '' },
    statusLabel: { textContent: '' },
    dayLabel: { textContent: '' },
    populationLabel: { textContent: '' },
    moraleLabel: { textContent: '' },
    storageLabel: { textContent: '' },
    pauseBtn: { textContent: '' },
    speedButtons: [],
  };
}

test('renderGameUITopState maps labels onto top bar elements', () => {
  const elements = createTopBarElements();
  const state = { status: 'Running', day: 7, paused: true };
  const buildClockLabel = (nextState) => `Clock-${nextState.day}`;
  const buildPauseButtonLabel = (paused) => (paused ? 'Resume' : 'Pause');

  renderGameUITopState({
    elements,
    state,
    populationText: '12/20',
    morale: '88%',
    storageText: '73%',
    buildClockLabel,
    buildPauseButtonLabel,
  });

  assert.equal(elements.clockLabel.textContent, 'Clock-7');
  assert.equal(elements.statusLabel.textContent, 'Running');
  assert.equal(elements.dayLabel.textContent, '7');
  assert.equal(elements.populationLabel.textContent, '12/20');
  assert.equal(elements.moraleLabel.textContent, '88%');
  assert.equal(elements.storageLabel.textContent, '73%');
  assert.equal(elements.pauseBtn.textContent, 'Resume');
});

test('renderGameUISpeedButtons toggles active speed classes by state', () => {
  const toggles = [];
  const elements = createTopBarElements();
  elements.speedButtons = [0, 1, 2].map((index) => ({
    classList: {
      toggle: (className, active) => {
        toggles.push({ index, className, active });
      },
    },
  }));

  renderGameUISpeedButtons({
    elements,
    speed: 2,
    buildSpeedButtonStates: () => [{ active: false }, { active: true }, { active: false }],
  });

  assert.deepEqual(toggles, [
    { index: 0, className: 'active', active: false },
    { index: 1, className: 'active', active: true },
    { index: 2, className: 'active', active: false },
  ]);
});

