import { getBuildingCardState } from './buildingAvailability.js';
import { buildBuildCardRows, buildCategoryPillRows } from './buildMenuViewState.js';
import { renderColonistPanel, renderConstructionQueuePanel, renderResearchPanels } from './colonyPanelsDom.js';
import { renderObjectivesPanel, renderRunStatsPanel, renderSelectionPanel } from './infoPanelsDom.js';
import { buildResourceBarRows } from './resourceBarViewState.js';
import { buildSelectOptionRows, renderSelectOptions } from './selectOptionsView.js';
import { renderGameUIBuildCards, renderGameUIBuildCategories } from './gameUIBuildMenuDom.js';
import { createBuildCardElement, createBuildCategoryButton, createResourceChipElement } from './gameUICardElements.js';
import { renderGameUIResourceBar } from './gameUIResourceBarDom.js';
import { renderGameUISelectDropdown } from './gameUISelectOptions.js';
import {
  buildGameUIColonistPanelInvocation,
  buildGameUIConstructionQueueInvocation,
  buildGameUIObjectivesPanelInvocation,
  buildGameUIResearchPanelInvocation,
  buildGameUIRunStatsPanelInvocation,
  buildGameUISelectionPanelInvocation,
} from './gameUIPanelInvocations.js';
import { createGameUIRuntime } from './gameUIRuntime.js';
import { renderGameUISpeedButtons, renderGameUITopState } from './gameUITopBarDom.js';
import { buildClockLabel, buildPauseButtonLabel, buildSpeedButtonStates } from './topBarViewState.js';
import { formatCost, formatRate } from './uiFormatting.js';

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

  renderBuildCategories(state, categories, onSelectCategory) {
    renderGameUIBuildCategories({
      elements: this.el,
      categories,
      selectedCategory: state.selectedCategory,
      buildCategoryPillRows,
      createBuildCategoryButton,
      onSelectCategory,
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
    this.renderBuildCategories(state, categories, onSelectCategory);
    renderGameUIBuildCards({
      elements: this.el,
      state,
      selectedBuildType,
      isBuildingUnlocked,
      buildingDefinitions: this.buildingDefinitions,
      formatCost,
      getBuildingCardState,
      buildBuildCardRows,
      spriteFactory: this.spriteFactory,
      createBuildCardElement,
      onToggleBuildType,
    });
  }

  renderResearch(state, getAvailableResearch, onStartResearch) {
    renderResearchPanels(buildGameUIResearchPanelInvocation(this, state, getAvailableResearch, onStartResearch));
  }

  renderConstructionQueue(state) {
    renderConstructionQueuePanel(buildGameUIConstructionQueueInvocation(this, state));
  }

  renderColonists(state) {
    renderColonistPanel(buildGameUIColonistPanelInvocation(this, state));
  }

  renderObjectives(state, objectives, rewardMultiplier, formatObjectiveReward, getCurrentObjectiveIds) {
    renderObjectivesPanel(buildGameUIObjectivesPanelInvocation(
      this,
      state,
      objectives,
      rewardMultiplier,
      formatObjectiveReward,
      getCurrentObjectiveIds,
    ));
  }

  renderRunStats(state) {
    renderRunStatsPanel(buildGameUIRunStatsPanelInvocation(this, state));
  }

  renderSelection(selection, state) {
    renderSelectionPanel(buildGameUISelectionPanelInvocation(this, selection, state));
  }
}

