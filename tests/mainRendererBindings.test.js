import test from 'node:test';
import assert from 'node:assert/strict';
import { bindMainRendererInteractions } from '../src/mainRendererBindings.js';

function createHarness() {
  const notifications = [];
  const calls = [];
  const handlers = {
    ground: null,
    preview: null,
    entitySelect: null,
  };
  const renderer = {
    setGroundClickHandler: (handler) => { handlers.ground = handler; },
    setPlacementPreviewHandler: (handler) => { handlers.preview = handler; },
    setEntitySelectHandler: (handler) => { handlers.entitySelect = handler; },
    updatePlacementMarker: (position, valid) => {
      calls.push({ method: 'updatePlacementMarker', position, valid });
    },
  };
  const engine = {
    state: {
      selectedBuildingType: null,
    },
    queueBuilding: (type, x, z) => {
      calls.push({ method: 'queueBuilding', type, x, z });
      return { ok: true };
    },
    setSelectedBuildingType: (value) => {
      calls.push({ method: 'setSelectedBuildingType', value });
      engine.state.selectedBuildingType = value;
    },
  };
  const ui = {
    setSelectedBuildType: (value) => calls.push({ method: 'setSelectedBuildType', value }),
    setSelectedEntity: (entity) => calls.push({ method: 'setSelectedEntity', entity }),
  };
  const notify = (payload) => notifications.push(payload);
  return {
    renderer,
    engine,
    ui,
    notify,
    calls,
    notifications,
    handlers,
  };
}

test('ground click handler warns when no building type is selected', () => {
  const harness = createHarness();
  bindMainRendererInteractions({
    renderer: harness.renderer,
    engine: harness.engine,
    ui: harness.ui,
    notify: harness.notify,
    buildingDefinitions: {},
  });

  harness.handlers.ground({ x: 2, z: 3 });

  assert.deepEqual(harness.notifications, [
    { kind: 'warn', message: 'Select a building first.' },
  ]);
  assert.deepEqual(harness.calls, []);
});

test('ground click handler reports queue errors and completes successful placements', () => {
  const harness = createHarness();
  harness.engine.state.selectedBuildingType = 'hut';
  let queueOk = false;
  harness.engine.queueBuilding = (type, x, z) => {
    harness.calls.push({ method: 'queueBuilding', type, x, z });
    return queueOk ? { ok: true } : { ok: false, message: 'Cannot place there' };
  };
  bindMainRendererInteractions({
    renderer: harness.renderer,
    engine: harness.engine,
    ui: harness.ui,
    notify: harness.notify,
    buildingDefinitions: {},
  });

  harness.handlers.ground({ x: 1, z: -2 });
  queueOk = true;
  harness.engine.state.selectedBuildingType = 'hut';
  harness.handlers.ground({ x: 4, z: 7 });

  assert.deepEqual(harness.notifications, [
    { kind: 'error', message: 'Cannot place there' },
  ]);
  assert.deepEqual(harness.calls, [
    { method: 'queueBuilding', type: 'hut', x: 1, z: -2 },
    { method: 'queueBuilding', type: 'hut', x: 4, z: 7 },
    { method: 'setSelectedBuildingType', value: null },
    { method: 'setSelectedBuildType', value: null },
    { method: 'updatePlacementMarker', position: null, valid: true },
  ]);
});

test('preview handler clears marker when nothing selected and blocks locked buildings', () => {
  const harness = createHarness();
  const buildingDefinitions = { hut: { id: 'hut' } };
  bindMainRendererInteractions({
    renderer: harness.renderer,
    engine: harness.engine,
    ui: harness.ui,
    notify: harness.notify,
    buildingDefinitions,
  }, {
    isUnlocked: () => false,
  });

  harness.handlers.preview({ x: 3, z: 6 });
  harness.engine.state.selectedBuildingType = 'hut';
  harness.handlers.preview({ x: 8, z: 9 });

  assert.deepEqual(harness.calls, [
    { method: 'updatePlacementMarker', position: null, valid: false },
    { method: 'updatePlacementMarker', position: { x: 8, z: 9 }, valid: false },
  ]);
});

test('preview handler uses placement validity and entity select forwards to UI', () => {
  const harness = createHarness();
  harness.engine.state.selectedBuildingType = 'hut';
  bindMainRendererInteractions({
    renderer: harness.renderer,
    engine: harness.engine,
    ui: harness.ui,
    notify: harness.notify,
    buildingDefinitions: { hut: { id: 'hut' } },
  }, {
    isUnlocked: () => true,
    isPlacementAllowed: () => ({ valid: false }),
  });

  harness.handlers.preview({ x: -1, z: 5 });
  harness.handlers.entitySelect({ kind: 'building', id: 'hut-1' });

  assert.deepEqual(harness.calls, [
    { method: 'updatePlacementMarker', position: { x: -1, z: 5 }, valid: false },
    { method: 'setSelectedEntity', entity: { kind: 'building', id: 'hut-1' } },
  ]);
});
