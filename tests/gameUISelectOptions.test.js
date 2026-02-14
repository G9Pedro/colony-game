import test from 'node:test';
import assert from 'node:assert/strict';
import { renderGameUISelectDropdown } from '../src/ui/gameUISelectOptions.js';

test('renderGameUISelectDropdown builds rows and renders options', () => {
  const selectElement = { id: 'scenario-select' };
  const options = [
    { id: 'calm', name: 'Calm' },
    { id: 'storm', name: 'Storm' },
  ];
  const buildCalls = [];
  const renderCalls = [];
  const rows = [{ value: 'calm', label: 'Calm', selected: true }];

  renderGameUISelectDropdown({
    selectElement,
    options,
    selectedId: 'calm',
    getId: (option) => option.id,
    getLabel: (option) => option.name,
    buildSelectOptionRows: (items, config) => {
      buildCalls.push({ items, config });
      return rows;
    },
    renderSelectOptions: (element, nextRows) => {
      renderCalls.push({ element, rows: nextRows });
    },
  });

  assert.equal(buildCalls.length, 1);
  assert.equal(buildCalls[0].items, options);
  assert.equal(buildCalls[0].config.selectedId, 'calm');
  assert.equal(buildCalls[0].config.getId(options[1]), 'storm');
  assert.equal(buildCalls[0].config.getLabel(options[1]), 'Storm');
  assert.deepEqual(renderCalls, [{ element: selectElement, rows }]);
});

