import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSelectOptionRows, renderSelectOptions } from '../src/ui/selectOptionsView.js';

test('buildSelectOptionRows maps items to select option rows', () => {
  const rows = buildSelectOptionRows(
    [
      { id: 'default', name: 'Default' },
      { id: 'hard', name: 'Hardcore' },
    ],
    {
      selectedId: 'hard',
      getId: (item) => item.id,
      getLabel: (item) => item.name,
    },
  );

  assert.deepEqual(rows, [
    { value: 'default', label: 'Default', selected: false },
    { value: 'hard', label: 'Hardcore', selected: true },
  ]);
});

test('renderSelectOptions clears and appends options', () => {
  const appended = [];
  const selectElement = {
    innerHTML: 'stale',
    appendChild(node) {
      appended.push(node);
    },
  };
  const documentObject = {
    createElement(tagName) {
      return {
        tagName,
        value: '',
        textContent: '',
        selected: false,
      };
    },
  };

  renderSelectOptions(selectElement, [
    { value: 'isometric', label: 'Isometric', selected: true },
    { value: 'three', label: 'Legacy 3D', selected: false },
  ], documentObject);

  assert.equal(selectElement.innerHTML, '');
  assert.equal(appended.length, 2);
  assert.deepEqual(appended, [
    {
      tagName: 'option',
      value: 'isometric',
      textContent: 'Isometric',
      selected: true,
    },
    {
      tagName: 'option',
      value: 'three',
      textContent: 'Legacy 3D',
      selected: false,
    },
  ]);
});

