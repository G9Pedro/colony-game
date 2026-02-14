import { buildSelectOptionRows, renderSelectOptions } from './selectOptionsView.js';
import { createUIControllerDefaultCallbacks, createUIControllerElements } from './uiControllerElements.js';
import { buildUiControllerRenderInvocation } from './uiControllerRenderInvocation.js';
import { bindUIGlobalActions } from './uiGlobalActionBindings.js';
import { runUiControllerRender } from './uiControllerRenderFlow.js';
import { createUIControllerRuntime } from './uiControllerRuntime.js';
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

    this.el = createUIControllerElements(document);

    this.callbacks = createUIControllerDefaultCallbacks();

    Object.assign(this, createUIControllerRuntime({
      elements: this.el,
      buildingDefinitions: this.buildingDefinitions,
      researchDefinitions: this.researchDefinitions,
      resourceDefinitions: this.resourceDefinitions,
      onCenterRequest: (point) => {
        this.renderer?.centerOnBuilding(point);
      },
    }));

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
    runUiControllerRender(buildUiControllerRenderInvocation(this, state));
  }
}
