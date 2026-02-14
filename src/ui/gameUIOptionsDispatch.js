import { buildSelectOptionRows, renderSelectOptions } from './selectOptionsView.js';
import { renderGameUISelectDropdown } from './gameUISelectOptions.js';

export function dispatchGameUIScenarioOptions(gameUI, scenarios, currentScenarioId, deps = {}) {
  const renderDropdown = deps.renderDropdown ?? renderGameUISelectDropdown;
  const optionRowsBuilder = deps.optionRowsBuilder ?? buildSelectOptionRows;
  const selectOptionsRenderer = deps.selectOptionsRenderer ?? renderSelectOptions;

  renderDropdown({
    selectElement: gameUI.el.scenarioSelect,
    options: scenarios,
    selectedId: currentScenarioId,
    getId: (scenario) => scenario.id,
    getLabel: (scenario) => scenario.name,
    buildSelectOptionRows: optionRowsBuilder,
    renderSelectOptions: selectOptionsRenderer,
  });
}

export function dispatchGameUIBalanceProfileOptions(gameUI, profiles, currentProfileId, deps = {}) {
  const renderDropdown = deps.renderDropdown ?? renderGameUISelectDropdown;
  const optionRowsBuilder = deps.optionRowsBuilder ?? buildSelectOptionRows;
  const selectOptionsRenderer = deps.selectOptionsRenderer ?? renderSelectOptions;

  renderDropdown({
    selectElement: gameUI.el.balanceProfileSelect,
    options: profiles,
    selectedId: currentProfileId,
    getId: (profile) => profile.id,
    getLabel: (profile) => profile.name,
    buildSelectOptionRows: optionRowsBuilder,
    renderSelectOptions: selectOptionsRenderer,
  });
}

