import test from 'node:test';
import assert from 'node:assert/strict';
import { applyHudStateToElements, syncBannerState } from '../src/ui/uiControllerDomState.js';

test('applyHudStateToElements maps hud fields to UI controls', () => {
  const elements = {
    scenarioSelect: { value: '' },
    balanceProfileSelect: { value: '' },
    rendererModeSelect: { value: '' },
    renderStatsLabel: { textContent: '' },
  };
  applyHudStateToElements(elements, {
    scenarioId: 'winter',
    balanceProfileId: 'hardcore',
    rendererMode: 'three',
    renderStatsLabel: '60 fps',
  });

  assert.equal(elements.scenarioSelect.value, 'winter');
  assert.equal(elements.balanceProfileSelect.value, 'hardcore');
  assert.equal(elements.rendererModeSelect.value, 'three');
  assert.equal(elements.renderStatsLabel.textContent, '60 fps');
});

test('syncBannerState chooses show/hide branch based on banner message', () => {
  const calls = [];
  const shown = syncBannerState({
    bannerMessage: 'Paused',
    showBanner: (message) => calls.push({ type: 'show', message }),
    hideBanner: () => calls.push({ type: 'hide' }),
  });
  const hidden = syncBannerState({
    bannerMessage: '',
    showBanner: (message) => calls.push({ type: 'show', message }),
    hideBanner: () => calls.push({ type: 'hide' }),
  });

  assert.equal(shown, 'shown');
  assert.equal(hidden, 'hidden');
  assert.deepEqual(calls, [
    { type: 'show', message: 'Paused' },
    { type: 'hide' },
  ]);
});

