import { buildResourceBarRows } from './resourceBarViewState.js';
import { buildSelectOptionRows, renderSelectOptions } from './selectOptionsView.js';
import { dispatchGameUIBuildMenu } from './gameUIBuildMenuDispatch.js';
import { createResourceChipElement } from './gameUICardElements.js';
import {
  dispatchGameUIColonistPanel,
  dispatchGameUIConstructionQueuePanel,
  dispatchGameUIObjectivesPanel,
  dispatchGameUIResearchPanel,
  dispatchGameUIRunStatsPanel,
  dispatchGameUISelectionPanel,
} from './gameUIPanelDispatch.js';
import { renderGameUIResourceBar } from './gameUIResourceBarDom.js';
import { renderGameUISelectDropdown } from './gameUISelectOptions.js';
import { createGameUIRuntime } from './gameUIRuntime.js';
import { renderGameUISpeedButtons, renderGameUITopState } from './gameUITopBarDom.js';
import { buildClockLabel, buildPauseButtonLabel, buildSpeedButtonStates } from './topBarViewState.js';
import { formatRate } from './uiFormatting.js';

export class GameUI {
  constructor({ elements, buildingDefinitions, researchDefinitions, resourceDefinitions, spriteFactory }) {
    this.el = elements;
    this.buildingDefinitions = buildingDefinitions;
    this.researchDefinitions = researchDefinitions;
    this.resourceDefinitions = resourceDefinitions;
    this.spriteFactory = spriteFactory;
    Object.assign(this, createGameUIRuntime());
  }

  setScenarioOptions(scenarios, currentScenarioId) {
    renderGameUISelectDropdown({
      selectElement: this.el.scenarioSelect,
      options: scenarios,
      selectedId: currentScenarioId,
      getId: (scenario) => scenario.id,
      getLabel: (scenario) => scenario.name,
      buildSelectOptionRows,
      renderSelectOptions,
    });
  }

  setBalanceProfileOptions(profiles, currentProfileId) {
    renderGameUISelectDropdown({
      selectElement: this.el.balanceProfileSelect,
      options: profiles,
      selectedId: currentProfileId,
      getId: (profile) => profile.id,
      getLabel: (profile) => profile.name,
      buildSelectOptionRows,
      renderSelectOptions,
    });
  }

  updateResourceRates(state) {
    this.resourceRates = this.resourceFlowTracker.sample(state.resources, state.timeSeconds);
  }

  renderTopState(state, { populationText, morale, storageText }) {
    renderGameUITopState({
      elements: this.el,
      state,
      populationText,
      morale,
      storageText,
      buildClockLabel,
      buildPauseButtonLabel,
    });
  }

  renderSpeedButtons(state) {
    renderGameUISpeedButtons({
      elements: this.el,
      speed: state.speed,
      buildSpeedButtonStates,
    });
  }

  renderResourceBar(state) {
    this.updateResourceRates(state);
    renderGameUIResourceBar({
      elements: this.el,
      resourceDefinitions: this.resourceDefinitions,
      resources: state.resources,
      resourceRates: this.resourceRates,
      valueAnimator: this.valueAnimator,
      spriteFactory: this.spriteFactory,
      buildResourceBarRows,
      createResourceChipElement,
      formatRate,
    });
  }

  renderBuildList({
    state,
    selectedBuildType,
    onToggleBuildType,
    onSelectCategory,
    categories,
    isBuildingUnlocked,
  }) {
    dispatchGameUIBuildMenu(this, {
      state,
      selectedBuildType,
      onToggleBuildType,
      onSelectCategory,
      categories,
      isBuildingUnlocked,
    });
  }

  renderResearch(state, getAvailableResearch, onStartResearch) {
    dispatchGameUIResearchPanel(this, state, getAvailableResearch, onStartResearch);
  }

  renderConstructionQueue(state) {
    dispatchGameUIConstructionQueuePanel(this, state);
  }

  renderColonists(state) {
    dispatchGameUIColonistPanel(this, state);
  }

  renderObjectives(state, objectives, rewardMultiplier, formatObjectiveReward, getCurrentObjectiveIds) {
    dispatchGameUIObjectivesPanel(
      this,
      state,
      objectives,
      rewardMultiplier,
      formatObjectiveReward,
      getCurrentObjectiveIds,
    );
  }

  renderRunStats(state) {
    dispatchGameUIRunStatsPanel(this, state);
  }

  renderSelection(selection, state) {
    dispatchGameUISelectionPanel(this, selection, state);
  }
}

