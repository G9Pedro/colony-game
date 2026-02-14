import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSelectionPanelViewModel } from '../src/ui/selectionPanelViewState.js';

test('buildSelectionPanelViewModel returns empty prompt for no selection', () => {
  const panel = buildSelectionPanelViewModel({
    selection: null,
    state: {},
    buildingDefinitions: {},
    buildBuildingSelectionDetails: () => ({}),
    buildColonistSelectionDetails: () => ({}),
  });

  assert.deepEqual(panel, {
    title: 'Selection',
    rows: [],
    message: 'Tap a building or colonist to inspect details.',
  });
});

test('buildSelectionPanelViewModel delegates building and colonist details', () => {
  const state = { key: 'state' };
  const buildingDefinitions = { farm: { name: 'Farm' } };
  const panelFromBuilding = { title: 'Building', rows: [{ label: 'Type', value: 'Utility' }], message: null };
  const panelFromColonist = { title: 'Colonist', rows: [{ label: 'Job', value: 'builder' }], message: null };
  const buildingCalls = [];
  const colonistCalls = [];

  const buildingPanel = buildSelectionPanelViewModel({
    selection: { type: 'building', id: 'b-1' },
    state,
    buildingDefinitions,
    buildBuildingSelectionDetails: (...args) => {
      buildingCalls.push(args);
      return panelFromBuilding;
    },
    buildColonistSelectionDetails: (...args) => {
      colonistCalls.push(args);
      return panelFromColonist;
    },
  });
  const colonistPanel = buildSelectionPanelViewModel({
    selection: { type: 'colonist', id: 'c-1' },
    state,
    buildingDefinitions,
    buildBuildingSelectionDetails: (...args) => {
      buildingCalls.push(args);
      return panelFromBuilding;
    },
    buildColonistSelectionDetails: (...args) => {
      colonistCalls.push(args);
      return panelFromColonist;
    },
  });

  assert.deepEqual(buildingPanel, panelFromBuilding);
  assert.deepEqual(colonistPanel, panelFromColonist);
  assert.deepEqual(buildingCalls, [
    [{ type: 'building', id: 'b-1' }, state, buildingDefinitions],
  ]);
  assert.deepEqual(colonistCalls, [
    [{ type: 'colonist', id: 'c-1' }, state],
  ]);
});

test('buildSelectionPanelViewModel returns fallback for unsupported type', () => {
  const panel = buildSelectionPanelViewModel({
    selection: { type: 'tile', id: 't-1' },
    state: {},
    buildingDefinitions: {},
    buildBuildingSelectionDetails: () => null,
    buildColonistSelectionDetails: () => null,
  });
  assert.deepEqual(panel, {
    title: 'Selection',
    rows: [],
    message: 'Unsupported selection.',
  });
});

