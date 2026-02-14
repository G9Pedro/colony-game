import { createUIControllerDefaultCallbacks, createUIControllerElements } from './uiControllerElements.js';
import { buildUiControllerRenderInvocation } from './uiControllerRenderInvocation.js';
import { bindUIGlobalActions } from './uiGlobalActionBindings.js';
import { buildUIGlobalActionInvocation } from './uiGlobalActionInvocation.js';
import { runUiControllerRender } from './uiControllerRenderFlow.js';
import { createUIControllerRuntime } from './uiControllerRuntime.js';
import { renderUIRendererModeOptions } from './uiRendererModeOptions.js';
import { applyUIControllerPersistenceCallbacks } from './uiControllerCallbacks.js';
import {
  applyUIControllerSelectedBuildType,
  applyUIControllerSelectedEntity,
  attachUIRenderer,
  hideUIControllerBanner,
  pushUIControllerNotification,
  showUIControllerBanner,
} from './uiControllerState.js';
import {
  applyUIControllerBalanceProfileOptions,
  applyUIControllerScenarioOptions,
} from './uiControllerGameOptions.js';

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
    bindUIGlobalActions(buildUIGlobalActionInvocation(this));
  }

  setPersistenceCallbacks(callbacks) {
    applyUIControllerPersistenceCallbacks(this, callbacks);
  }

  attachRenderer(renderer) {
    attachUIRenderer(this, renderer);
  }

  setRendererModeOptions(modes, activeMode) {
    renderUIRendererModeOptions(this, modes, activeMode);
  }

  setSelectedEntity(entity) {
    applyUIControllerSelectedEntity(this, entity);
  }

  setSelectedBuildType(buildingType) {
    applyUIControllerSelectedBuildType(this, buildingType);
  }

  setScenarioOptions(scenarios, currentScenarioId) {
    applyUIControllerScenarioOptions(this, scenarios, currentScenarioId);
  }

  setBalanceProfileOptions(profiles, currentProfileId) {
    applyUIControllerBalanceProfileOptions(this, profiles, currentProfileId);
  }

  showBanner(message) {
    showUIControllerBanner(this, message);
  }

  hideBanner() {
    hideUIControllerBanner(this);
  }

  pushNotification(payload) {
    pushUIControllerNotification(this, payload);
  }

  render(state) {
    runUiControllerRender(buildUiControllerRenderInvocation(this, state));
  }
}
