import { SpriteFactory } from '../render/spriteFactory.js';
import { GameUI } from './gameUI.js';
import { Minimap } from './minimap.js';
import { NotificationCenter } from './notifications.js';
import { buildSelectOptionRows, renderSelectOptions } from './selectOptionsView.js';
import { bindUIGlobalActions } from './uiGlobalActionBindings.js';
import { runUiControllerRender } from './uiControllerRenderFlow.js';
import { getRendererModeLabel } from './uiViewState.js';

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
    bindUIGlobalActions({
      elements: this.el,
      engine: this.engine,
      getCallbacks: () => this.callbacks,
      pushNotification: (payload) => {
        this.pushNotification(payload);
      },
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
    const rows = buildSelectOptionRows(modes, {
      selectedId: activeMode,
      getId: (mode) => mode,
      getLabel: (mode) => getRendererModeLabel(mode),
    });
    renderSelectOptions(this.el.rendererModeSelect, rows);
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
    runUiControllerRender({
      state,
      selectedBuildType: this.selectedBuildType,
      selectedEntity: this.selectedEntity,
      engine: this.engine,
      renderer: this.renderer,
      elements: this.el,
      gameUI: this.gameUI,
      minimap: this.minimap,
      pushNotification: (payload) => this.pushNotification(payload),
      setSelectedBuildType: (buildingType) => {
        this.selectedBuildType = buildingType;
      },
      showBanner: (message) => this.showBanner(message),
      hideBanner: () => this.hideBanner(),
    });
  }
}
