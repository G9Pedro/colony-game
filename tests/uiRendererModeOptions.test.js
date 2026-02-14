import test from 'node:test';
import assert from 'node:assert/strict';
import { renderUIRendererModeOptions } from '../src/ui/uiRendererModeOptions.js';

function createControllerStub() {
  return {
    el: {
      rendererModeSelect: { id: 'renderer-mode-select' },
    },
  };
}

test('renderUIRendererModeOptions builds and renders renderer mode option rows', () => {
  const controller = createControllerStub();
  const modes = ['isometric', 'three'];
  const rows = [{ value: 'isometric', label: 'ISO', selected: true }];
  const calls = [];

  renderUIRendererModeOptions(controller, modes, 'isometric', {
    optionRowsBuilder: (inputModes, options) => {
      calls.push({
        type: 'build',
        inputModes,
        selectedId: options.selectedId,
        isometricId: options.getId('isometric'),
        threeLabel: options.getLabel('three'),
      });
      return rows;
    },
    optionRenderer: (selectElement, renderedRows) => {
      calls.push({
        type: 'render',
        selectElement,
        renderedRows,
      });
    },
    getModeLabel: (mode) => (mode === 'isometric' ? 'ISO' : 'THREE'),
  });

  assert.deepEqual(calls, [
    {
      type: 'build',
      inputModes: modes,
      selectedId: 'isometric',
      isometricId: 'isometric',
      threeLabel: 'THREE',
    },
    {
      type: 'render',
      selectElement: controller.el.rendererModeSelect,
      renderedRows: rows,
    },
  ]);
});

