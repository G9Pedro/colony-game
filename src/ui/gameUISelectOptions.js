export function renderGameUISelectDropdown({
  selectElement,
  options,
  selectedId,
  getId,
  getLabel,
  buildSelectOptionRows,
  renderSelectOptions,
}) {
  const rows = buildSelectOptionRows(options, {
    selectedId,
    getId,
    getLabel,
  });
  renderSelectOptions(selectElement, rows);
}

