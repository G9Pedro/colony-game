import { BUILDING_CATEGORIES } from '../content/buildings.js';
import { getAvailableResearch, getAverageMorale, getPopulationCapacity, getStorageCapacity, getUsedStorage, isBuildingUnlocked } from '../game/selectors.js';
import { SpriteFactory } from '../render/spriteFactory.js';
import { formatObjectiveReward, getCurrentObjectiveIds, getObjectiveDefinitions, getObjectiveRewardMultiplier } from '../systems/objectiveSystem.js';
import { GameUI } from './gameUI.js';
import { Minimap } from './minimap.js';
import { NotificationCenter } from './notifications.js';
import { formatRenderStatsLabel } from './renderStatsLabel.js';
import { buildUiControllerHudState, toggleBuildSelection } from './uiControllerViewState.js';
import { buildTopSummary, getRendererModeLabel, getStatusBannerMessage } from './uiViewState.js';

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
    this.selectedEntity = null;
    this.renderer = null;

    this.el = {
      scenarioSelect: document.getElementById('scenario-select'),
      balanceProfileSelect: document.getElementById('balance-profile-select'),
      rendererModeSelect: document.getElementById('renderer-mode-select'),
      renderStatsLabel: document.getElementById('render-stats'),
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
      clockLabel: document.getElementById('clock-label'),
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
      minimapCanvas: document.getElementById('minimap-canvas'),
      infoPanelTitle: document.getElementById('info-panel-title'),
      infoPanelBody: document.getElementById('info-panel-body'),
    };

    this.callbacks = {
      onSave: () => {},
      onLoad: () => {},
      onExport: () => {},
      onImport: async () => {},
      onReset: () => {},
      onScenarioChange: () => {},
      onBalanceProfileChange: () => {},
      onRendererModeChange: () => true,
    };

    this.spriteFactory = new SpriteFactory({ quality: 'balanced' });
    this.gameUI = new GameUI({
      elements: this.el,
      buildingDefinitions: this.buildingDefinitions,
      researchDefinitions: this.researchDefinitions,
      resourceDefinitions: this.resourceDefinitions,
      spriteFactory: this.spriteFactory,
    });
    this.notifications = new NotificationCenter(this.el.notifications);
    this.minimap = new Minimap(this.el.minimapCanvas, {
      onCenterRequest: (point) => {
        this.renderer?.centerOnBuilding(point);
      },
    });

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
    this.el.balanceProfileSelect.addEventListener('change', (event) =>
      this.callbacks.onBalanceProfileChange(event.target.value),
    );
    this.el.rendererModeSelect.addEventListener('change', (event) => {
      const success = this.callbacks.onRendererModeChange(event.target.value);
      if (!success) {
        this.pushNotification({
          kind: 'warn',
          message: 'Requested renderer mode is unavailable. Falling back to isometric.',
        });
      }
    });
  }

  setPersistenceCallbacks(callbacks) {
    this.callbacks = {
      ...this.callbacks,
      ...callbacks,
    };
  }

  attachRenderer(renderer) {
    this.renderer = renderer;
    this.el.rendererModeSelect.value = renderer.getRendererMode?.() ?? 'isometric';
  }

  setRendererModeOptions(modes, activeMode) {
    this.el.rendererModeSelect.innerHTML = '';
    modes.forEach((mode) => {
      const option = document.createElement('option');
      option.value = mode;
      option.textContent = getRendererModeLabel(mode);
      option.selected = mode === activeMode;
      this.el.rendererModeSelect.appendChild(option);
    });
  }

  setSelectedEntity(entity) {
    this.selectedEntity = entity;
  }

  setSelectedBuildType(buildingType) {
    this.selectedBuildType = buildingType;
  }

  setScenarioOptions(scenarios, currentScenarioId) {
    this.gameUI.setScenarioOptions(scenarios, currentScenarioId);
  }

  setBalanceProfileOptions(profiles, currentProfileId) {
    this.gameUI.setBalanceProfileOptions(profiles, currentProfileId);
  }

  showBanner(message) {
    this.el.messageBanner.classList.remove('hidden');
    this.el.messageBanner.textContent = message;
  }

  hideBanner() {
    this.el.messageBanner.classList.add('hidden');
  }

  pushNotification(payload) {
    this.notifications.push(payload);
  }

  render(state) {
    const topSummary = buildTopSummary(state, {
      getPopulationCapacity,
      getAverageMorale,
      getUsedStorage,
      getStorageCapacity,
    });

    this.gameUI.renderTopState(state, {
      populationText: topSummary.populationText,
      morale: topSummary.moraleText,
      storageText: topSummary.storageText,
    });
    this.gameUI.renderSpeedButtons(state);
    this.gameUI.renderResourceBar(state);
    this.gameUI.renderBuildList({
      state,
      selectedBuildType: this.selectedBuildType,
      onToggleBuildType: (buildingType) => {
        this.selectedBuildType = toggleBuildSelection(this.selectedBuildType, buildingType);
        this.engine.setSelectedBuildingType(this.selectedBuildType);
      },
      onSelectCategory: (category) => this.engine.setSelectedCategory(category),
      categories: BUILDING_CATEGORIES,
      isBuildingUnlocked,
    });
    this.gameUI.renderResearch(
      state,
      getAvailableResearch,
      (researchId) => {
        const result = this.engine.beginResearch(researchId);
        if (!result.ok) {
          this.pushNotification({ kind: 'error', message: result.message });
        }
      },
    );
    this.gameUI.renderObjectives(
      state,
      getObjectiveDefinitions(),
      getObjectiveRewardMultiplier(state),
      formatObjectiveReward,
      getCurrentObjectiveIds,
    );
    this.gameUI.renderConstructionQueue(state);
    this.gameUI.renderColonists(state);
    this.gameUI.renderRunStats(state);
    this.gameUI.renderSelection(this.selectedEntity, state);

    this.minimap.render(state, this.renderer?.getCameraState?.(), this.selectedEntity);
    const hudState = buildUiControllerHudState({
      state,
      renderer: this.renderer,
      formatRenderStatsLabel,
      getStatusBannerMessage,
    });
    this.el.scenarioSelect.value = hudState.scenarioId;
    this.el.balanceProfileSelect.value = hudState.balanceProfileId;
    this.el.rendererModeSelect.value = hudState.rendererMode;
    this.el.renderStatsLabel.textContent = hudState.renderStatsLabel;

    if (hudState.bannerMessage) {
      this.showBanner(hudState.bannerMessage);
    } else {
      this.hideBanner();
    }
  }
}
