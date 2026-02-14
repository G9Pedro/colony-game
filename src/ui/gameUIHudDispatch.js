import { buildResourceBarRows } from './resourceBarViewState.js';
import { createResourceChipElement } from './gameUICardElements.js';
import { renderGameUIResourceBar } from './gameUIResourceBarDom.js';
import { renderGameUISpeedButtons, renderGameUITopState } from './gameUITopBarDom.js';
import { buildClockLabel, buildPauseButtonLabel, buildSpeedButtonStates } from './topBarViewState.js';
import { formatRate } from './uiFormatting.js';

export function dispatchGameUIResourceRateSampling(gameUI, state, deps = {}) {
  const sampleRates = deps.sampleRates ?? ((resources, timeSeconds) =>
    gameUI.resourceFlowTracker.sample(resources, timeSeconds));
  gameUI.resourceRates = sampleRates(state.resources, state.timeSeconds);
  return gameUI.resourceRates;
}

export function dispatchGameUITopState(gameUI, state, summary, deps = {}) {
  const renderTopState = deps.renderTopState ?? renderGameUITopState;
  renderTopState({
    elements: gameUI.el,
    state,
    populationText: summary.populationText,
    morale: summary.morale,
    storageText: summary.storageText,
    buildClockLabel,
    buildPauseButtonLabel,
  });
}

export function dispatchGameUISpeedButtons(gameUI, state, deps = {}) {
  const renderSpeedButtons = deps.renderSpeedButtons ?? renderGameUISpeedButtons;
  renderSpeedButtons({
    elements: gameUI.el,
    speed: state.speed,
    buildSpeedButtonStates,
  });
}

export function dispatchGameUIResourceBar(gameUI, state, deps = {}) {
  const sampleRates = deps.sampleRates ?? dispatchGameUIResourceRateSampling;
  const renderResourceBar = deps.renderResourceBar ?? renderGameUIResourceBar;
  const resourceRowsBuilder = deps.resourceRowsBuilder ?? buildResourceBarRows;
  const resourceChipBuilder = deps.resourceChipBuilder ?? createResourceChipElement;
  const rateFormatter = deps.rateFormatter ?? formatRate;

  sampleRates(gameUI, state);
  renderResourceBar({
    elements: gameUI.el,
    resourceDefinitions: gameUI.resourceDefinitions,
    resources: state.resources,
    resourceRates: gameUI.resourceRates,
    valueAnimator: gameUI.valueAnimator,
    spriteFactory: gameUI.spriteFactory,
    buildResourceBarRows: resourceRowsBuilder,
    createResourceChipElement: resourceChipBuilder,
    formatRate: rateFormatter,
  });
}

