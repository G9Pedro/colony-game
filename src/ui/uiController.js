import { BUILDING_CATEGORIES } from '../content/buildings.js';
import { getAvailableResearch, getAverageMorale, getPopulationCapacity, getStorageCapacity, getUsedStorage, isBuildingUnlocked } from '../game/selectors.js';
import { formatObjectiveReward, getCurrentObjectiveIds, getObjectiveDefinitions, getObjectiveRewardMultiplier } from '../systems/objectiveSystem.js';
import {
  BUILDING_ICON_ASSETS,
  CATEGORY_ICON_ASSETS,
  COLONIST_PORTRAITS,
  RESOURCE_ICON_ASSETS,
  RESEARCH_ICON_ASSETS,
  UI_ASSETS,
} from '../assets/manifest.js';

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

function titleCase(value) {
  return value.replace(/-/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}

function createImageElement(src, alt, className = 'asset-icon') {
  const image = document.createElement('img');
  image.src = src;
  image.alt = alt;
  image.className = className;
  image.loading = 'lazy';
  return image;
}

export class UIController {
  constructor({
    engine,
    buildingDefinitions,
    researchDefinitions,
    resourceDefinitions,
  }) {
    this.engine = engine;
    this.buildingDefinitions = buildingDefinitions;
    this.researchDefinitions = researchDefinitions;
    this.resourceDefinitions = resourceDefinitions;
    this.selectedBuildType = null;

    this.el = {
      scenarioSelect: document.getElementById('scenario-select'),
      balanceProfileSelect: document.getElementById('balance-profile-select'),
      pauseBtn: document.getElementById('pause-btn'),
      speedButtons: [
        document.getElementById('speed-1-btn'),
        document.getElementById('speed-2-btn'),
        document.getElementById('speed-4-btn'),
      ],
      saveBtn: document.getElementById('save-btn'),
      loadBtn: document.getElementById('load-btn'),
      exportBtn: document.getElementById('export-btn'),
      importBtn: document.getElementById('import-btn'),
      importFileInput: document.getElementById('import-file-input'),
      resetBtn: document.getElementById('reset-btn'),
      hireBtn: document.getElementById('hire-btn'),
      statusLabel: document.getElementById('status-label'),
      logoImage: document.getElementById('logo-image'),
      dayLabel: document.getElementById('day-label'),
      populationLabel: document.getElementById('population-label'),
      moraleLabel: document.getElementById('morale-label'),
      storageLabel: document.getElementById('storage-label'),
      resourceList: document.getElementById('resource-list'),
      buildCategories: document.getElementById('build-categories'),
      buildList: document.getElementById('build-list'),
      researchCurrent: document.getElementById('research-current'),
      researchList: document.getElementById('research-list'),
      objectivesList: document.getElementById('objectives-list'),
      constructionList: document.getElementById('construction-list'),
      colonistList: document.getElementById('colonist-list'),
      metricsSummary: document.getElementById('metrics-summary'),
      runHistory: document.getElementById('run-history'),
      notifications: document.getElementById('notifications'),
      messageBanner: document.getElementById('message-banner'),
      hintBadge: document.getElementById('hint-badge'),
    };

    this.callbacks = {
      onSave: () => {},
      onLoad: () => {},
      onExport: () => {},
      onImport: async () => {},
      onReset: () => {},
      onScenarioChange: () => {},
      onBalanceProfileChange: () => {},
    };
    this.bindGlobalActions();
    this.applyBrandingAssets();
  }

  bindGlobalActions() {
    this.el.pauseBtn.addEventListener('click', () => this.engine.togglePause());
    this.el.speedButtons[0].addEventListener('click', () => this.engine.setSpeed(1));
    this.el.speedButtons[1].addEventListener('click', () => this.engine.setSpeed(2));
    this.el.speedButtons[2].addEventListener('click', () => this.engine.setSpeed(4));
    this.el.hireBtn.addEventListener('click', () => {
      const result = this.engine.hireColonist();
      if (!result.ok) {
        this.pushNotification({ kind: 'error', message: result.message });
      }
    });

    this.el.saveBtn.addEventListener('click', () => this.callbacks.onSave());
    this.el.loadBtn.addEventListener('click', () => this.callbacks.onLoad());
    this.el.exportBtn.addEventListener('click', () => this.callbacks.onExport());
    this.el.importBtn.addEventListener('click', () => this.el.importFileInput.click());
    this.el.importFileInput.addEventListener('change', async (event) => {
      const [file] = event.target.files;
      if (!file) {
        return;
      }
      await this.callbacks.onImport(file);
      event.target.value = '';
    });
    this.el.resetBtn.addEventListener('click', () => this.callbacks.onReset());
    this.el.scenarioSelect.addEventListener('change', (event) =>
      this.callbacks.onScenarioChange(event.target.value),
    );
    this.el.balanceProfileSelect.addEventListener('change', (event) =>
      this.callbacks.onBalanceProfileChange(event.target.value),
    );
  }

  setPersistenceCallbacks(callbacks) {
    this.callbacks = {
      ...this.callbacks,
      ...callbacks,
    };
  }

  setSelectedBuildType(buildingType) {
    this.selectedBuildType = buildingType;
  }

  applyBrandingAssets() {
    if (this.el.logoImage) {
      this.el.logoImage.src = UI_ASSETS.logo;
    }

    const faviconLink = document.querySelector('link[rel="icon"]');
    if (faviconLink) {
      faviconLink.href = UI_ASSETS.favicon;
    }

    document.documentElement.style.setProperty('--panel-texture-url', `url("${UI_ASSETS.panelTexture}")`);
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

  renderCategories(state) {
    this.el.buildCategories.innerHTML = '';
    for (const category of BUILDING_CATEGORIES) {
      const button = document.createElement('button');
      button.className = category === state.selectedCategory ? 'button-with-icon active' : 'button-with-icon';
      const iconPath = CATEGORY_ICON_ASSETS[category];
      if (iconPath) {
        button.appendChild(createImageElement(iconPath, `${category} icon`, 'button-icon'));
      }
      const label = document.createElement('span');
      label.textContent = titleCase(category);
      button.appendChild(label);
      button.addEventListener('click', () => this.engine.setSelectedCategory(category));
      this.el.buildCategories.appendChild(button);
    }
  }

  renderBuildList(state) {
    this.el.buildList.innerHTML = '';
    const buildings = Object.values(this.buildingDefinitions).filter(
      (definition) => definition.category === state.selectedCategory,
    );

    for (const definition of buildings) {
      const unlocked = isBuildingUnlocked(state, definition);
      const canAfford = Object.entries(definition.cost).every(
        ([resource, amount]) => (state.resources[resource] ?? 0) >= amount,
      );

      const card = document.createElement('div');
      card.className = 'card';

      const button = document.createElement('button');
      button.className = this.selectedBuildType === definition.id
        ? 'button-with-icon build-button active'
        : 'button-with-icon build-button';
      const iconPath = BUILDING_ICON_ASSETS[definition.id];
      if (iconPath) {
        button.appendChild(createImageElement(iconPath, `${definition.name} icon`, 'button-icon'));
      }
      const label = document.createElement('span');
      label.textContent = `${definition.name} (${definition.buildTime}s)`;
      button.appendChild(label);
      button.disabled = !unlocked;
      button.addEventListener('click', () => {
        this.selectedBuildType = this.selectedBuildType === definition.id ? null : definition.id;
        this.engine.setSelectedBuildingType(this.selectedBuildType);
      });

      const meta = document.createElement('small');
      if (!unlocked) {
        meta.textContent = `Requires: ${definition.requiredTech}`;
      } else if (!canAfford) {
        meta.textContent = `Need: ${formatCost(definition.cost)}`;
      } else {
        meta.textContent = `Cost: ${formatCost(definition.cost)}`;
      }

      card.append(button, meta);
      this.el.buildList.appendChild(card);
    }
  }

  renderResources(state) {
    this.el.resourceList.innerHTML = '';
    for (const [resource, definition] of Object.entries(this.resourceDefinitions)) {
      const amount = state.resources[resource] ?? 0;
      const card = document.createElement('div');
      card.className = 'card resource-card';
      const row = document.createElement('div');
      row.className = 'kv';

      const labelGroup = document.createElement('div');
      labelGroup.className = 'label-with-icon';
      const iconPath = RESOURCE_ICON_ASSETS[resource];
      if (iconPath) {
        labelGroup.appendChild(createImageElement(iconPath, `${definition.label} resource`, 'asset-icon'));
      }
      const label = document.createElement('span');
      label.textContent = definition.label;
      labelGroup.appendChild(label);

      const value = document.createElement('strong');
      value.textContent = Math.floor(amount).toString();

      row.append(labelGroup, value);
      card.appendChild(row);
      this.el.resourceList.appendChild(card);
    }
  }

  renderResearch(state) {
    this.el.researchCurrent.innerHTML = '';
    if (state.research.current) {
      const tech = this.researchDefinitions[state.research.current];
      const progress = percent(state.research.progress, tech.time);
      const card = document.createElement('div');
      card.className = 'card';

      const heading = document.createElement('div');
      heading.className = 'label-with-icon';
      const iconPath = RESEARCH_ICON_ASSETS[tech.id];
      if (iconPath) {
        heading.appendChild(createImageElement(iconPath, `${tech.name} research`, 'asset-icon'));
      }
      const title = document.createElement('strong');
      title.textContent = tech.name;
      heading.appendChild(title);

      const progressBar = document.createElement('div');
      progressBar.className = 'progress';
      const bar = document.createElement('span');
      bar.style.width = `${progress}%`;
      progressBar.appendChild(bar);

      const meta = document.createElement('small');
      meta.textContent = `${Math.floor(progress)}% complete`;

      card.append(heading, progressBar, meta);
      this.el.researchCurrent.appendChild(card);
    } else {
      this.el.researchCurrent.innerHTML = '<div class="card"><small>No active research</small></div>';
    }

    this.el.researchList.innerHTML = '';
    const researchItems = getAvailableResearch(state, this.researchDefinitions);
    for (const item of researchItems) {
      if (state.research.current === item.id || state.research.completed.includes(item.id)) {
        continue;
      }
      const card = document.createElement('div');
      card.className = 'card';
      const button = document.createElement('button');
      button.classList.add('button-with-icon');
      const iconPath = RESEARCH_ICON_ASSETS[item.id];
      if (iconPath) {
        button.appendChild(createImageElement(iconPath, `${item.name} research`, 'button-icon'));
      }
      const label = document.createElement('span');
      label.textContent = `Research ${item.name}`;
      button.appendChild(label);
      button.disabled = state.resources.knowledge < item.cost || !!state.research.current;
      button.addEventListener('click', () => {
        const result = this.engine.beginResearch(item.id);
        if (!result.ok) {
          this.pushNotification({ kind: 'error', message: result.message });
        }
      });
      const info = document.createElement('small');
      info.textContent = `${item.description} Cost: ${item.cost} knowledge`;
      card.append(button, info);
      this.el.researchList.appendChild(card);
    }
  }

  renderObjectives(state) {
    this.el.objectivesList.innerHTML = '';
    const objectives = getObjectiveDefinitions();
    const rewardMultiplier = getObjectiveRewardMultiplier(state);
    for (const objective of objectives) {
      const completed = state.objectives.completed.includes(objective.id);
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <div class="kv"><strong>${objective.title}</strong><small>${completed ? 'Done' : 'Active'}</small></div>
        <small>${objective.description}</small>
        <small style="color:#38bdf8;">Reward: ${formatObjectiveReward(objective, rewardMultiplier)}</small>
      `;
      if (completed) {
        card.style.borderColor = 'rgba(34, 197, 94, 0.65)';
      }
      this.el.objectivesList.appendChild(card);
    }

    const remainingObjectiveIds = getCurrentObjectiveIds(state);
    if (remainingObjectiveIds.length === 0) {
      this.el.hintBadge.textContent = 'All objectives completed. Push for charter victory!';
      return;
    }
    const nextObjective = objectives.find((objective) => objective.id === remainingObjectiveIds[0]);
    this.el.hintBadge.textContent = `Current objective: ${nextObjective.title}`;
  }

  renderConstructionQueue(state) {
    if (state.constructionQueue.length === 0) {
      this.el.constructionList.textContent = 'No active construction';
      return;
    }

    this.el.constructionList.innerHTML = '';
    for (const item of state.constructionQueue) {
      const building = this.buildingDefinitions[item.type];
      const progress = percent(item.progress, item.buildTime);
      const card = document.createElement('div');
      card.className = 'card';
      const heading = document.createElement('div');
      heading.className = 'label-with-icon';
      const iconPath = BUILDING_ICON_ASSETS[item.type];
      if (iconPath) {
        heading.appendChild(createImageElement(iconPath, `${building.name} construction`, 'asset-icon'));
      }
      const title = document.createElement('strong');
      title.textContent = building.name;
      heading.appendChild(title);

      const progressBar = document.createElement('div');
      progressBar.className = 'progress';
      const bar = document.createElement('span');
      bar.style.width = `${progress}%`;
      progressBar.appendChild(bar);

      const meta = document.createElement('small');
      meta.textContent = `${Math.floor(progress)}% complete`;

      card.append(heading, progressBar, meta);
      this.el.constructionList.appendChild(card);
    }
  }

  renderColonists(state) {
    this.el.colonistList.innerHTML = '';
    const aliveColonists = state.colonists.filter((colonist) => colonist.alive);
    for (const colonist of aliveColonists.slice(0, 14)) {
      const card = document.createElement('div');
      card.className = 'card colonist-card';

      const profileRow = document.createElement('div');
      profileRow.className = 'profile-row';
      const portraitPath = colonist.job === 'builder' ? COLONIST_PORTRAITS.builder : COLONIST_PORTRAITS.laborer;
      profileRow.appendChild(createImageElement(portraitPath, `${colonist.name} portrait`, 'colonist-avatar'));
      const nameWrap = document.createElement('div');
      const name = document.createElement('strong');
      name.textContent = colonist.name;
      const task = document.createElement('small');
      task.textContent = `${titleCase(colonist.job)} · ${colonist.task}`;
      nameWrap.append(name, task);
      profileRow.appendChild(nameWrap);

      const needs = document.createElement('small');
      needs.textContent = `H ${Math.floor(colonist.needs.health)} · F ${Math.floor(colonist.needs.hunger)} · R ${Math.floor(colonist.needs.rest)} · M ${Math.floor(colonist.needs.morale)}`;

      card.append(profileRow, needs);
      this.el.colonistList.appendChild(card);
    }
  }

  renderRunStats(state) {
    const latestViolation = state.debug?.invariantViolations?.at?.(-1);
    this.el.metricsSummary.innerHTML = `
      <div class="card">
        <div class="kv"><span>Peak Population</span><strong>${state.metrics.peakPopulation}</strong></div>
        <div class="kv"><span>Built Structures</span><strong>${state.metrics.buildingsConstructed}</strong></div>
        <div class="kv"><span>Research Completed</span><strong>${state.metrics.researchCompleted}</strong></div>
        <div class="kv"><span>Objectives Completed</span><strong>${state.metrics.objectivesCompleted}</strong></div>
        <div class="kv"><span>Deaths</span><strong>${state.metrics.deaths}</strong></div>
        <div class="kv"><span>Invariant Violations</span><strong>${state.debug?.invariantViolations?.length ?? 0}</strong></div>
      </div>
    `;

    if (latestViolation) {
      const warningCard = document.createElement('div');
      warningCard.className = 'card';
      warningCard.style.borderColor = 'rgba(239, 68, 68, 0.6)';
      warningCard.innerHTML = `<small><strong>Latest invariant issue:</strong> ${latestViolation.message}</small>`;
      this.el.metricsSummary.appendChild(warningCard);
    }

    const history = [...(state.runSummaryHistory ?? [])].slice(-3).reverse();
    if (history.length === 0) {
      this.el.runHistory.innerHTML = '<div class="card"><small>No previous completed runs yet.</small></div>';
      return;
    }

    this.el.runHistory.innerHTML = '';
    history.forEach((run) => {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <div class="kv"><strong>${run.outcome === 'won' ? 'Victory' : 'Defeat'}</strong><small>Day ${run.day}</small></div>
        <small>${run.scenarioId}/${run.balanceProfileId ?? 'standard'} · peak ${run.peakPopulation} pop · ${run.buildingsConstructed} builds</small>
      `;
      this.el.runHistory.appendChild(card);
    });
  }

  renderStatus(state) {
    const alivePopulation = state.colonists.filter((colonist) => colonist.alive).length;
    const populationCap = getPopulationCapacity(state);
    const avgMorale = getAverageMorale(state);
    const storageUsed = getUsedStorage(state);
    const storageCap = getStorageCapacity(state);

    this.el.statusLabel.textContent = state.status;
    this.el.dayLabel.textContent = String(state.day);
    this.el.populationLabel.textContent = `${alivePopulation} / ${populationCap}`;
    this.el.moraleLabel.textContent = Math.floor(avgMorale).toString();
    this.el.storageLabel.textContent = `${Math.floor(storageUsed)} / ${storageCap}`;
    this.el.pauseBtn.textContent = state.paused ? 'Resume' : 'Pause';
    this.el.speedButtons.forEach((button, index) => {
      const speed = index === 0 ? 1 : index === 1 ? 2 : 4;
      button.classList.toggle('active', state.speed === speed);
    });
    this.el.scenarioSelect.value = state.scenarioId;
    this.el.balanceProfileSelect.value = state.balanceProfileId;

    if (state.status === 'won') {
      this.showBanner('Victory! Colony Charter Achieved.');
    } else if (state.status === 'lost') {
      this.showBanner('Defeat. Reset to start a new colony.');
    } else {
      this.hideBanner();
    }
  }

  showBanner(message) {
    this.el.messageBanner.classList.remove('hidden');
    this.el.messageBanner.textContent = message;
  }

  hideBanner() {
    this.el.messageBanner.classList.add('hidden');
  }

  pushNotification({ kind = 'warn', message }) {
    const toast = document.createElement('div');
    toast.className = `toast ${kind}`;
    toast.textContent = message;
    this.el.notifications.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 3500);
  }

  render(state) {
    this.renderStatus(state);
    this.renderResources(state);
    this.renderCategories(state);
    this.renderBuildList(state);
    this.renderResearch(state);
    this.renderObjectives(state);
    this.renderConstructionQueue(state);
    this.renderColonists(state);
    this.renderRunStats(state);
  }
}
