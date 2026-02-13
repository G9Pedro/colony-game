import { BUILDING_CATEGORIES } from '../content/buildings.js';
import { getAvailableResearch, getAverageMorale, getPopulationCapacity, getStorageCapacity, getUsedStorage, isBuildingUnlocked } from '../game/selectors.js';
import { getObjectiveDefinitions } from '../systems/objectiveSystem.js';

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
      notifications: document.getElementById('notifications'),
      messageBanner: document.getElementById('message-banner'),
    };

    this.callbacks = {
      onSave: () => {},
      onLoad: () => {},
      onExport: () => {},
      onImport: async () => {},
      onReset: () => {},
      onScenarioChange: () => {},
    };
    this.bindGlobalActions();
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

  renderCategories(state) {
    this.el.buildCategories.innerHTML = '';
    for (const category of BUILDING_CATEGORIES) {
      const button = document.createElement('button');
      button.textContent = category;
      button.className = category === state.selectedCategory ? 'active' : '';
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
      button.textContent = `${definition.name} (${definition.buildTime}s)`;
      button.disabled = !unlocked;
      button.className = this.selectedBuildType === definition.id ? 'active' : '';
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
      card.className = 'card';
      card.innerHTML = `<div class="kv"><span>${definition.label}</span><strong>${Math.floor(amount)}</strong></div>`;
      this.el.resourceList.appendChild(card);
    }
  }

  renderResearch(state) {
    if (state.research.current) {
      const tech = this.researchDefinitions[state.research.current];
      const progress = percent(state.research.progress, tech.time);
      this.el.researchCurrent.innerHTML = `
        <div class="card">
          <strong>${tech.name}</strong>
          <div class="progress"><span style="width: ${progress}%"></span></div>
          <small>${Math.floor(progress)}% complete</small>
        </div>
      `;
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
      button.textContent = `Research ${item.name}`;
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
    for (const objective of objectives) {
      const completed = state.objectives.completed.includes(objective.id);
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <div class="kv"><strong>${objective.title}</strong><small>${completed ? 'Done' : 'Active'}</small></div>
        <small>${objective.description}</small>
      `;
      if (completed) {
        card.style.borderColor = 'rgba(34, 197, 94, 0.65)';
      }
      this.el.objectivesList.appendChild(card);
    }
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
      card.innerHTML = `
        <strong>${building.name}</strong>
        <div class="progress"><span style="width: ${progress}%"></span></div>
        <small>${Math.floor(progress)}% complete</small>
      `;
      this.el.constructionList.appendChild(card);
    }
  }

  renderColonists(state) {
    this.el.colonistList.innerHTML = '';
    const aliveColonists = state.colonists.filter((colonist) => colonist.alive);
    for (const colonist of aliveColonists.slice(0, 14)) {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <strong>${colonist.name}</strong>
        <div class="kv"><span>${colonist.job}</span><small>${colonist.task}</small></div>
        <small>H ${Math.floor(colonist.needs.health)} · F ${Math.floor(colonist.needs.hunger)} · R ${Math.floor(colonist.needs.rest)} · M ${Math.floor(colonist.needs.morale)}</small>
      `;
      this.el.colonistList.appendChild(card);
    }
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
  }
}
