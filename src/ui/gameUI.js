import { AnimationManager } from '../render/animations.js';
import { buildBuildingSelectionDetails, buildColonistSelectionDetails } from './selectionDetails.js';

function formatCost(cost) {
  return Object.entries(cost)
    .map(([resource, amount]) => `${amount} ${resource}`)
    .join(', ');
}

function percent(part, whole) {
  if (whole <= 0) {
    return 0;
  }
  return Math.max(0, Math.min(100, (part / whole) * 100));
}

function formatRate(value) {
  const rounded = Math.abs(value) < 0.05 ? 0 : value;
  if (rounded === 0) {
    return '±0/day';
  }
  return `${rounded > 0 ? '+' : ''}${rounded.toFixed(1)}/day`;
}

export class GameUI {
  constructor({ elements, buildingDefinitions, researchDefinitions, resourceDefinitions, spriteFactory }) {
    this.el = elements;
    this.buildingDefinitions = buildingDefinitions;
    this.researchDefinitions = researchDefinitions;
    this.resourceDefinitions = resourceDefinitions;
    this.spriteFactory = spriteFactory;
    this.valueAnimator = new AnimationManager();

    this.resourceRateSample = {
      values: null,
      atSeconds: 0,
      rates: {},
    };
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
    if (!this.resourceRateSample.values) {
      this.resourceRateSample = {
        values: { ...state.resources },
        atSeconds: state.timeSeconds,
        rates: {},
      };
      return;
    }
    const elapsed = state.timeSeconds - this.resourceRateSample.atSeconds;
    if (elapsed < 1.2) {
      return;
    }
    const rates = {};
    Object.keys(state.resources).forEach((resource) => {
      const delta = state.resources[resource] - (this.resourceRateSample.values[resource] ?? state.resources[resource]);
      rates[resource] = (delta / elapsed) * 24;
    });
    this.resourceRateSample = {
      values: { ...state.resources },
      atSeconds: state.timeSeconds,
      rates,
    };
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

    Object.entries(this.resourceDefinitions).forEach(([resource, definition]) => {
      const displayed = this.valueAnimator.tweenValue(
        `resource:${resource}`,
        state.resources[resource] ?? 0,
      );
      const rounded = Math.floor(displayed);
      const rate = this.resourceRateSample.rates[resource] ?? 0;

      const card = document.createElement('div');
      card.className = 'resource-chip';

      const icon = this.spriteFactory.getResourceIcon(resource, 20);
      const iconNode = document.createElement('canvas');
      iconNode.width = icon.width;
      iconNode.height = icon.height;
      iconNode.className = 'resource-icon';
      iconNode.getContext('2d').drawImage(icon, 0, 0);

      const name = document.createElement('span');
      name.className = 'resource-name';
      name.textContent = definition.label;
      const value = document.createElement('strong');
      value.textContent = `${rounded}`;
      const delta = document.createElement('small');
      delta.textContent = formatRate(rate);
      delta.className = rate >= 0 ? 'positive' : 'negative';

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
      const unlocked = isBuildingUnlocked(state, definition);
      const canAfford = Object.entries(definition.cost).every(
        ([resource, amount]) => (state.resources[resource] ?? 0) >= amount,
      );

      const card = document.createElement('button');
      card.className = `build-card ${selectedBuildType === definition.id ? 'active' : ''}`;
      card.disabled = !unlocked;
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
      subtitle.textContent = !unlocked
        ? `Requires ${definition.requiredTech}`
        : `${definition.buildTime}s · ${formatCost(definition.cost)}`;
      if (unlocked && !canAfford) {
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
    if (state.research.current) {
      const tech = this.researchDefinitions[state.research.current];
      const progress = percent(state.research.progress, tech.time);
      this.el.researchCurrent.innerHTML = `
        <div class="panel-card">
          <div class="kv"><strong>${tech.name}</strong><small>${Math.floor(progress)}%</small></div>
          <div class="progress-track"><span style="width:${progress}%"></span></div>
        </div>
      `;
    } else {
      this.el.researchCurrent.innerHTML = '<div class="panel-card"><small>No active research</small></div>';
    }

    this.el.researchList.innerHTML = '';
    const options = getAvailableResearch(state, this.researchDefinitions);
    options.forEach((item) => {
      if (state.research.current === item.id || state.research.completed.includes(item.id)) {
        return;
      }

      const card = document.createElement('div');
      card.className = 'panel-card';
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'secondary';
      button.textContent = `Research ${item.name}`;
      button.disabled = state.resources.knowledge < item.cost || !!state.research.current;
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
    state.constructionQueue.forEach((item) => {
      const building = this.buildingDefinitions[item.type];
      const progress = percent(item.progress, item.buildTime);
      const card = document.createElement('div');
      card.className = 'panel-card';
      card.innerHTML = `
        <div class="kv"><strong>${building.name}</strong><small>${Math.floor(progress)}%</small></div>
        <div class="progress-track"><span style="width:${progress}%"></span></div>
      `;
      this.el.constructionList.appendChild(card);
    });
  }

  renderColonists(state) {
    this.el.colonistList.innerHTML = '';
    state.colonists
      .filter((colonist) => colonist.alive)
      .slice(0, 18)
      .forEach((colonist) => {
        const card = document.createElement('div');
        card.className = 'panel-card';
        card.innerHTML = `
          <div class="kv"><strong>${colonist.name}</strong><small>${colonist.job}</small></div>
          <small>${colonist.task} · H${Math.floor(colonist.needs.health)} F${Math.floor(colonist.needs.hunger)} R${Math.floor(colonist.needs.rest)} M${Math.floor(colonist.needs.morale)}</small>
        `;
        this.el.colonistList.appendChild(card);
      });
  }

  renderObjectives(state, objectives, rewardMultiplier, formatObjectiveReward, getCurrentObjectiveIds) {
    this.el.objectivesList.innerHTML = '';
    objectives.forEach((objective) => {
      const completed = state.objectives.completed.includes(objective.id);
      const card = document.createElement('div');
      card.className = `panel-card ${completed ? 'completed' : ''}`;
      card.innerHTML = `
        <div class="kv"><strong>${objective.title}</strong><small>${completed ? 'Done' : 'Active'}</small></div>
        <small>${objective.description}</small>
        <small class="reward-label">Reward: ${formatObjectiveReward(objective, rewardMultiplier)}</small>
      `;
      this.el.objectivesList.appendChild(card);
    });
    const remaining = getCurrentObjectiveIds(state);
    const current = objectives.find((objective) => objective.id === remaining[0]);
    this.el.hintBadge.textContent = current
      ? `Current objective: ${current.title}`
      : 'All objectives complete. Charter victory is within reach.';
  }

  renderRunStats(state) {
    const latestViolation = state.debug?.invariantViolations?.at?.(-1);
    this.el.metricsSummary.innerHTML = `
      <div class="panel-card">
        <div class="kv"><span>Peak Population</span><strong>${state.metrics.peakPopulation}</strong></div>
        <div class="kv"><span>Built Structures</span><strong>${state.metrics.buildingsConstructed}</strong></div>
        <div class="kv"><span>Research Completed</span><strong>${state.metrics.researchCompleted}</strong></div>
        <div class="kv"><span>Objectives Completed</span><strong>${state.metrics.objectivesCompleted}</strong></div>
        <div class="kv"><span>Deaths</span><strong>${state.metrics.deaths}</strong></div>
      </div>
    `;
    if (latestViolation) {
      const warning = document.createElement('div');
      warning.className = 'panel-card warning';
      warning.textContent = `Invariant warning: ${latestViolation.message}`;
      this.el.metricsSummary.appendChild(warning);
    }

    const history = [...(state.runSummaryHistory ?? [])].slice(-3).reverse();
    this.el.runHistory.innerHTML = '';
    if (history.length === 0) {
      this.el.runHistory.innerHTML = '<div class="panel-card"><small>No previous runs yet.</small></div>';
      return;
    }
    history.forEach((run) => {
      const card = document.createElement('div');
      card.className = 'panel-card';
      card.innerHTML = `
        <div class="kv"><strong>${run.outcome === 'won' ? 'Victory' : 'Defeat'}</strong><small>Day ${run.day}</small></div>
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

