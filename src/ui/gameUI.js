import { getBuildingCardState } from './buildingAvailability.js';
import { buildBuildCardRows, buildCategoryPillRows } from './buildMenuViewState.js';
import { renderColonistPanel, renderConstructionQueuePanel, renderResearchPanels } from './colonyPanelsDom.js';
import { renderObjectivesPanel, renderRunStatsPanel, renderSelectionPanel } from './infoPanelsDom.js';
import { buildResourceBarRows } from './resourceBarViewState.js';
import { buildSelectOptionRows, renderSelectOptions } from './selectOptionsView.js';
import { createBuildCardElement, createBuildCategoryButton, createResourceChipElement } from './gameUICardElements.js';
import {
  buildGameUIColonistPanelInvocation,
  buildGameUIConstructionQueueInvocation,
  buildGameUIObjectivesPanelInvocation,
  buildGameUIResearchPanelInvocation,
  buildGameUIRunStatsPanelInvocation,
  buildGameUISelectionPanelInvocation,
} from './gameUIPanelInvocations.js';
import { createGameUIRuntime } from './gameUIRuntime.js';
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
    const rows = buildSelectOptionRows(scenarios, {
      selectedId: currentScenarioId,
      getId: (scenario) => scenario.id,
      getLabel: (scenario) => scenario.name,
    });
    renderSelectOptions(this.el.scenarioSelect, rows);
  }

  setBalanceProfileOptions(profiles, currentProfileId) {
    const rows = buildSelectOptionRows(profiles, {
      selectedId: currentProfileId,
      getId: (profile) => profile.id,
      getLabel: (profile) => profile.name,
    });
    renderSelectOptions(this.el.balanceProfileSelect, rows);
  }

  updateResourceRates(state) {
    this.resourceRates = this.resourceFlowTracker.sample(state.resources, state.timeSeconds);
  }

  renderTopState(state, { populationText, morale, storageText }) {
    this.el.clockLabel.textContent = buildClockLabel(state);
    this.el.statusLabel.textContent = state.status;
    this.el.dayLabel.textContent = String(state.day);
    this.el.populationLabel.textContent = populationText;
    this.el.moraleLabel.textContent = morale;
    this.el.storageLabel.textContent = storageText;
    this.el.pauseBtn.textContent = buildPauseButtonLabel(state.paused);
  }

  renderSpeedButtons(state) {
    const speedStates = buildSpeedButtonStates(state.speed);
    this.el.speedButtons.forEach((button, index) => {
      button.classList.toggle('active', !!speedStates[index]?.active);
    });
  }

  renderResourceBar(state) {
    this.updateResourceRates(state);
    this.el.resourceList.innerHTML = '';
    const rows = buildResourceBarRows({
      resourceDefinitions: this.resourceDefinitions,
      resources: state.resources,
      resourceRates: this.resourceRates,
      mapDisplayedValue: (resourceId, value) => this.valueAnimator.tweenValue(`resource:${resourceId}`, value),
    });

    rows.forEach((row) => {
      const icon = this.spriteFactory.getResourceIcon(row.id, 20);
      const card = createResourceChipElement({
        row,
        icon,
        formatRate,
      });
      this.el.resourceList.appendChild(card);
    });
  }

  renderBuildCategories(state, categories, onSelectCategory) {
    this.el.buildCategories.innerHTML = '';
    const rows = buildCategoryPillRows(categories, state.selectedCategory);
    rows.forEach((row) => {
      const button = createBuildCategoryButton({
        row,
        onSelectCategory,
      });
      this.el.buildCategories.appendChild(button);
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
    this.el.buildList.innerHTML = '';
    const rows = buildBuildCardRows({
      state,
      selectedBuildType,
      buildingDefinitions: this.buildingDefinitions,
      isBuildingUnlocked,
      formatCost,
      getBuildingCardState,
    });

    rows.forEach((row) => {
      const thumb = this.spriteFactory.getBuildingThumbnail(row.id, 58);
      const card = createBuildCardElement({
        row,
        thumbnail: thumb,
        onToggleBuildType,
      });
      this.el.buildList.appendChild(card);
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

