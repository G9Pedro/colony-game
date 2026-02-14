import { buildSelectOptionRows, renderSelectOptions } from './selectOptionsView.js';
import { getRendererModeLabel } from './uiViewState.js';

export function renderUIRendererModeOptions(controller, modes, activeMode, deps = {}) {
  const optionRowsBuilder = deps.optionRowsBuilder ?? buildSelectOptionRows;
  const optionRenderer = deps.optionRenderer ?? renderSelectOptions;
  const getModeLabel = deps.getModeLabel ?? getRendererModeLabel;

  const rows = optionRowsBuilder(modes, {
    selectedId: activeMode,
    getId: (mode) => mode,
    getLabel: (mode) => getModeLabel(mode),
  });
  optionRenderer(controller.el.rendererModeSelect, rows);
}

