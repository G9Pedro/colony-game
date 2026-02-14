import { AnimationManager } from '../render/animations.js';
import { getBuildingCardState } from './buildingAvailability.js';
import { buildBuildCardRows, buildCategoryPillRows } from './buildMenuViewState.js';
import { renderColonistPanel, renderConstructionQueuePanel, renderResearchPanels } from './colonyPanelsDom.js';
import { renderObjectivesPanel, renderRunStatsPanel, renderSelectionPanel } from './infoPanelsDom.js';
import { ResourceFlowTracker } from './resourceFlowTracker.js';
import { buildResourceBarRows } from './resourceBarViewState.js';
import { buildSelectOptionRows, renderSelectOptions } from './selectOptionsView.js';
import { createBuildCardElement, createBuildCategoryButton, createResourceChipElement } from './gameUICardElements.js';
import { buildClockLabel, buildPauseButtonLabel, buildSpeedButtonStates } from './topBarViewState.js';
import { formatCost, formatRate } from './uiFormatting.js';

export class GameUI {
  constructor({ elements, buildingDefinitions, researchDefinitions, resourceDefinitions, spriteFactory }) {
    this.el = elements;
    this.buildingDefinitions = buildingDefinitions;
    this.researchDefinitions = researchDefinitions;
    this.resourceDefinitions = resourceDefinitions;
    this.spriteFactory = spriteFactory;
    this.valueAnimator = new AnimationManager();
    this.resourceFlowTracker = new ResourceFlowTracker({ minElapsedSeconds: 1.2, hoursPerDay: 24 });
    this.resourceRates = {};
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
    renderResearchPanels({
      currentElement: this.el.researchCurrent,
      listElement: this.el.researchList,
      state,
      researchDefinitions: this.researchDefinitions,
      getAvailableResearch,
      onStartResearch,
    });
  }

  renderConstructionQueue(state) {
    renderConstructionQueuePanel({
      listElement: this.el.constructionList,
      state,
      buildingDefinitions: this.buildingDefinitions,
    });
  }

  renderColonists(state) {
    renderColonistPanel({
      listElement: this.el.colonistList,
      state,
      limit: 18,
    });
  }

  renderObjectives(state, objectives, rewardMultiplier, formatObjectiveReward, getCurrentObjectiveIds) {
    renderObjectivesPanel({
      listElement: this.el.objectivesList,
      hintElement: this.el.hintBadge,
      state,
      objectives,
      rewardMultiplier,
      formatObjectiveReward,
      getCurrentObjectiveIds,
    });
  }

  renderRunStats(state) {
    renderRunStatsPanel({
      metricsElement: this.el.metricsSummary,
      historyElement: this.el.runHistory,
      state,
      historyLimit: 3,
    });
  }

  renderSelection(selection, state) {
    renderSelectionPanel({
      titleElement: this.el.infoPanelTitle,
      bodyElement: this.el.infoPanelBody,
      selection,
      state,
      buildingDefinitions: this.buildingDefinitions,
    });
  }
}

