import test from 'node:test';
import assert from 'node:assert/strict';
import { buildUiControllerHudState, toggleBuildSelection } from '../src/ui/uiControllerViewState.js';

test('toggleBuildSelection deselects active build type and selects different type', () => {
  assert.equal(toggleBuildSelection('farm', 'farm'), null);
  assert.equal(toggleBuildSelection('farm', 'house'), 'house');
  assert.equal(toggleBuildSelection(null, 'warehouse'), 'warehouse');
});

test('buildUiControllerHudState maps renderer-derived hud values', () => {
  const state = {
    scenarioId: 'coastal',
    balanceProfileId: 'hard',
    status: 'Prospering',
  };
  const hud = buildUiControllerHudState({
    state,
    renderer: {
      getRendererMode: () => 'three',
      getDebugStats: () => ({ fps: 57.2, mode: 'three' }),
    },
    formatRenderStatsLabel: (stats) => `${stats.mode}:${Math.round(stats.fps)}`,
    getStatusBannerMessage: (status) => (status === 'Prospering' ? 'Great run' : ''),
  });

  assert.deepEqual(hud, {
    scenarioId: 'coastal',
    balanceProfileId: 'hard',
    rendererMode: 'three',
    renderStatsLabel: 'three:57',
    bannerMessage: 'Great run',
  });
});

test('buildUiControllerHudState falls back to default renderer mode', () => {
  const hud = buildUiControllerHudState({
    state: {
      scenarioId: 'default',
      balanceProfileId: 'normal',
      status: 'Stable',
    },
    renderer: null,
    formatRenderStatsLabel: () => 'N/A',
    getStatusBannerMessage: () => '',
  });

  assert.equal(hud.rendererMode, 'isometric');
  assert.equal(hud.renderStatsLabel, 'N/A');
  assert.equal(hud.bannerMessage, '');
});

