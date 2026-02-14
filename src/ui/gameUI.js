import { AnimationManager } from '../render/animations.js';
import { getBuildingCardState } from './buildingAvailability.js';
import { buildBuildCardRows, buildCategoryPillRows } from './buildMenuViewState.js';
import { buildColonistRows, buildConstructionQueueRows } from './colonyPanelsViewState.js';
import { buildObjectiveHint, buildObjectiveRows } from './objectivesViewState.js';
import { ResourceFlowTracker } from './resourceFlowTracker.js';
import { buildResourceBarRows } from './resourceBarViewState.js';
import { buildSelectionPanelViewModel } from './selectionPanelViewState.js';
import { buildBuildingSelectionDetails, buildColonistSelectionDetails } from './selectionDetails.js';
import { buildRunStatsPanelViewModel } from './runStatsPanelViewState.js';
import { buildActiveResearchViewModel, buildResearchOptionViewModels } from './researchViewState.js';
import { buildSelectOptionRows, renderSelectOptions } from './selectOptionsView.js';
import { createBuildCardElement, createBuildCategoryButton, createResourceChipElement } from './gameUICardElements.js';
import { buildClockLabel, buildPauseButtonLabel, buildSpeedButtonStates } from './topBarViewState.js';
import { formatCost, formatRate, percent } from './uiFormatting.js';

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
    this.el.researchCurrent.innerHTML = '';
    const activeResearch = buildActiveResearchViewModel(
      state.research,
      this.researchDefinitions,
      percent,
    );
    if (activeResearch) {
      this.el.researchCurrent.innerHTML = `
        <div class="panel-card">
          <div class="kv"><strong>${activeResearch.name}</strong><small>${Math.floor(activeResearch.progress)}%</small></div>
          <div class="progress-track"><span style="width:${activeResearch.progress}%"></span></div>
        </div>
      `;
    } else {
      this.el.researchCurrent.innerHTML = '<div class="panel-card"><small>No active research</small></div>';
    }

    this.el.researchList.innerHTML = '';
    const options = buildResearchOptionViewModels({
      state,
      researchDefinitions: this.researchDefinitions,
      getAvailableResearch,
    });
    options.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'panel-card';
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'secondary';
      button.textContent = `Research ${item.name}`;
      button.disabled = item.disabled;
      button.addEventListener('click', () => onStartResearch(item.id));
      const text = document.createElement('small');
      text.textContent = `${item.description} · ${item.cost} knowledge`;
      card.append(button, text);
      this.el.researchList.appendChild(card);
    });
  }

  renderConstructionQueue(state) {
    this.el.constructionList.innerHTML = '';
    if (state.constructionQueue.length === 0) {
      this.el.constructionList.innerHTML = '<div class="panel-card"><small>No active construction</small></div>';
      return;
    }
    const rows = buildConstructionQueueRows(state.constructionQueue, this.buildingDefinitions, percent);
    rows.forEach((row) => {
      const card = document.createElement('div');
      card.className = 'panel-card';
      card.innerHTML = `
        <div class="kv"><strong>${row.name}</strong><small>${Math.floor(row.progress)}%</small></div>
        <div class="progress-track"><span style="width:${row.progress}%"></span></div>
      `;
      this.el.constructionList.appendChild(card);
    });
  }

  renderColonists(state) {
    this.el.colonistList.innerHTML = '';
    const rows = buildColonistRows(state.colonists, 18);
    rows.forEach((row) => {
      const card = document.createElement('div');
      card.className = 'panel-card';
      card.innerHTML = `
        <div class="kv"><strong>${row.name}</strong><small>${row.job}</small></div>
        <small>${row.task} · H${row.health} F${row.hunger} R${row.rest} M${row.morale}</small>
      `;
      this.el.colonistList.appendChild(card);
    });
  }

  renderObjectives(state, objectives, rewardMultiplier, formatObjectiveReward, getCurrentObjectiveIds) {
    this.el.objectivesList.innerHTML = '';
    const rows = buildObjectiveRows({
      objectives,
      completedObjectiveIds: state.objectives.completed,
      rewardMultiplier,
      formatObjectiveReward,
    });
    rows.forEach((row) => {
      const card = document.createElement('div');
      card.className = `panel-card ${row.completed ? 'completed' : ''}`;
      card.innerHTML = `
        <div class="kv"><strong>${row.title}</strong><small>${row.completed ? 'Done' : 'Active'}</small></div>
        <small>${row.description}</small>
        <small class="reward-label">Reward: ${row.rewardLabel}</small>
      `;
      this.el.objectivesList.appendChild(card);
    });
    this.el.hintBadge.textContent = buildObjectiveHint({
      state,
      objectives,
      getCurrentObjectiveIds,
    });
  }

  renderRunStats(state) {
    const panel = buildRunStatsPanelViewModel(state, 3);
    const metricsMarkup = panel.metricsRows
      .map((row) => `<div class="kv"><span>${row.label}</span><strong>${row.value}</strong></div>`)
      .join('');
    this.el.metricsSummary.innerHTML = `
      <div class="panel-card">
        ${metricsMarkup}
      </div>
    `;
    if (panel.warningMessage) {
      const warning = document.createElement('div');
      warning.className = 'panel-card warning';
      warning.textContent = panel.warningMessage;
      this.el.metricsSummary.appendChild(warning);
    }

    this.el.runHistory.innerHTML = '';
    if (panel.historyRows.length === 0) {
      this.el.runHistory.innerHTML = '<div class="panel-card"><small>No previous runs yet.</small></div>';
      return;
    }
    panel.historyRows.forEach((run) => {
      const card = document.createElement('div');
      card.className = 'panel-card';
      card.innerHTML = `
        <div class="kv"><strong>${run.outcomeLabel}</strong><small>${run.dayLabel}</small></div>
        <small>${run.summary}</small>
      `;
      this.el.runHistory.appendChild(card);
    });
  }

  renderSelection(selection, state) {
    const panel = buildSelectionPanelViewModel({
      selection,
      state,
      buildingDefinitions: this.buildingDefinitions,
      buildBuildingSelectionDetails,
      buildColonistSelectionDetails,
    });
    this.el.infoPanelTitle.textContent = panel.title;
    if (panel.message) {
      this.el.infoPanelBody.innerHTML = `<small>${panel.message}</small>`;
      return;
    }
    this.el.infoPanelBody.innerHTML = panel.rows
      .map((row) => `<div class="kv"><span>${row.label}</span><strong>${row.value}</strong></div>`)
      .join('');
  }
}

