import { AnimationManager } from '../render/animations.js';
import { getBuildingCardState } from './buildingAvailability.js';
import { buildColonistRows, buildConstructionQueueRows } from './colonyPanelsViewState.js';
import { buildObjectiveHint, buildObjectiveRows } from './objectivesViewState.js';
import { ResourceFlowTracker } from './resourceFlowTracker.js';
import { buildResourceBarRows } from './resourceBarViewState.js';
import { buildBuildingSelectionDetails, buildColonistSelectionDetails } from './selectionDetails.js';
import {
  buildMetricsSummaryRows,
  getLatestInvariantWarning,
  getRecentRunHistory,
  getRunOutcomeLabel,
} from './runStatsView.js';
import { buildActiveResearchViewModel, buildResearchOptionViewModels } from './researchViewState.js';
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
    this.el.scenarioSelect.innerHTML = '';
    scenarios.forEach((scenario) => {
      const option = document.createElement('option');
      option.value = scenario.id;
      option.textContent = scenario.name;
      option.selected = scenario.id === currentScenarioId;
      this.el.scenarioSelect.appendChild(option);
    });
  }

  setBalanceProfileOptions(profiles, currentProfileId) {
    this.el.balanceProfileSelect.innerHTML = '';
    profiles.forEach((profile) => {
      const option = document.createElement('option');
      option.value = profile.id;
      option.textContent = profile.name;
      option.selected = profile.id === currentProfileId;
      this.el.balanceProfileSelect.appendChild(option);
    });
  }

  updateResourceRates(state) {
    this.resourceRates = this.resourceFlowTracker.sample(state.resources, state.timeSeconds);
  }

  renderTopState(state, { populationText, morale, storageText }) {
    this.el.clockLabel.textContent = `Day ${state.day} · ${state.paused ? 'Paused' : `${state.speed}x`}`;
    this.el.statusLabel.textContent = state.status;
    this.el.dayLabel.textContent = String(state.day);
    this.el.populationLabel.textContent = populationText;
    this.el.moraleLabel.textContent = morale;
    this.el.storageLabel.textContent = storageText;
    this.el.pauseBtn.textContent = state.paused ? '▶ Resume' : '⏸ Pause';
  }

  renderSpeedButtons(state) {
    this.el.speedButtons.forEach((button, index) => {
      const speed = index === 0 ? 1 : index === 1 ? 2 : 4;
      button.classList.toggle('active', state.speed === speed);
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

      const card = document.createElement('div');
      card.className = 'resource-chip';

      const icon = this.spriteFactory.getResourceIcon(row.id, 20);
      const iconNode = document.createElement('canvas');
      iconNode.width = icon.width;
      iconNode.height = icon.height;
      iconNode.className = 'resource-icon';
      iconNode.getContext('2d').drawImage(icon, 0, 0);

      const name = document.createElement('span');
      name.className = 'resource-name';
      name.textContent = row.label;
      const value = document.createElement('strong');
      value.textContent = `${row.roundedValue}`;
      const delta = document.createElement('small');
      delta.textContent = formatRate(row.rate);
      delta.className = row.rateClassName;

      const labelWrap = document.createElement('div');
      labelWrap.className = 'resource-meta';
      labelWrap.append(name, value, delta);
      card.append(iconNode, labelWrap);
      this.el.resourceList.appendChild(card);
    });
  }

  renderBuildCategories(state, categories, onSelectCategory) {
    this.el.buildCategories.innerHTML = '';
    categories.forEach((category) => {
      const button = document.createElement('button');
      button.className = `category-pill ${category === state.selectedCategory ? 'active' : ''}`;
      button.textContent = category;
      button.addEventListener('click', () => onSelectCategory(category));
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

    const candidates = Object.values(this.buildingDefinitions).filter(
      (definition) => definition.category === state.selectedCategory,
    );

    candidates.forEach((definition) => {
      const cardState = getBuildingCardState(state, definition, isBuildingUnlocked, formatCost);

      const card = document.createElement('button');
      card.className = `build-card ${selectedBuildType === definition.id ? 'active' : ''}`;
      card.disabled = !cardState.unlocked;
      card.type = 'button';
      card.addEventListener('click', () => onToggleBuildType(definition.id));

      const thumb = this.spriteFactory.getBuildingThumbnail(definition.id, 58);
      const thumbNode = document.createElement('canvas');
      thumbNode.width = thumb.width;
      thumbNode.height = thumb.height;
      thumbNode.className = 'build-thumb';
      thumbNode.getContext('2d').drawImage(thumb, 0, 0);

      const title = document.createElement('strong');
      title.textContent = definition.name;
      const subtitle = document.createElement('small');
      subtitle.textContent = cardState.subtitle;
      if (cardState.warning) {
        subtitle.classList.add('warning');
      }

      const meta = document.createElement('span');
      meta.className = 'build-meta';
      meta.append(title, subtitle);
      card.append(thumbNode, meta);
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
    const latestViolation = getLatestInvariantWarning(state.debug);
    const metricRows = buildMetricsSummaryRows(state.metrics);
    const metricsMarkup = metricRows
      .map((row) => `<div class="kv"><span>${row.label}</span><strong>${row.value}</strong></div>`)
      .join('');
    this.el.metricsSummary.innerHTML = `
      <div class="panel-card">
        ${metricsMarkup}
      </div>
    `;
    if (latestViolation) {
      const warning = document.createElement('div');
      warning.className = 'panel-card warning';
      warning.textContent = `Invariant warning: ${latestViolation.message}`;
      this.el.metricsSummary.appendChild(warning);
    }

    const history = getRecentRunHistory(state.runSummaryHistory, 3);
    this.el.runHistory.innerHTML = '';
    if (history.length === 0) {
      this.el.runHistory.innerHTML = '<div class="panel-card"><small>No previous runs yet.</small></div>';
      return;
    }
    history.forEach((run) => {
      const card = document.createElement('div');
      card.className = 'panel-card';
      card.innerHTML = `
        <div class="kv"><strong>${getRunOutcomeLabel(run.outcome)}</strong><small>Day ${run.day}</small></div>
        <small>${run.scenarioId}/${run.balanceProfileId ?? 'standard'} · peak ${run.peakPopulation} · ${run.buildingsConstructed} builds</small>
      `;
      this.el.runHistory.appendChild(card);
    });
  }

  renderSelection(selection, state) {
    this.el.infoPanelBody.innerHTML = '';
    if (!selection) {
      this.el.infoPanelTitle.textContent = 'Selection';
      this.el.infoPanelBody.innerHTML = '<small>Tap a building or colonist to inspect details.</small>';
      return;
    }

    if (selection.type === 'building') {
      const details = buildBuildingSelectionDetails(selection, state, this.buildingDefinitions);
      this.el.infoPanelTitle.textContent = details.title;
      if (details.message) {
        this.el.infoPanelBody.innerHTML = `<small>${details.message}</small>`;
        return;
      }
      this.el.infoPanelBody.innerHTML = details.rows
        .map((row) => `<div class="kv"><span>${row.label}</span><strong>${row.value}</strong></div>`)
        .join('');
      return;
    }

    if (selection.type === 'colonist') {
      const details = buildColonistSelectionDetails(selection, state);
      this.el.infoPanelTitle.textContent = details.title;
      if (details.message) {
        this.el.infoPanelBody.innerHTML = `<small>${details.message}</small>`;
        return;
      }
      this.el.infoPanelBody.innerHTML = details.rows
        .map((row) => `<div class="kv"><span>${row.label}</span><strong>${row.value}</strong></div>`)
        .join('');
    }
  }
}

