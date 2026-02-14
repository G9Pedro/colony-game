export function buildSelectOptionRows(items, {
  selectedId,
  getId,
  getLabel,
}) {
  return items.map((item) => {
    const id = getId(item);
    return {
      value: id,
      label: getLabel(item),
      selected: id === selectedId,
    };
  });
}

export function renderSelectOptions(selectElement, optionRows, documentObject = document) {
  selectElement.innerHTML = '';
  optionRows.forEach((row) => {
    const option = documentObject.createElement('option');
    option.value = row.value;
    option.textContent = row.label;
    option.selected = row.selected;
    selectElement.appendChild(option);
  });
}

