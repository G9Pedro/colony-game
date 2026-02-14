import test from 'node:test';
import assert from 'node:assert/strict';
import { createMainPersistenceCallbacks } from '../src/mainPersistenceCallbacks.js';

function createHarness() {
  const notifications = [];
  const calls = [];
  const engine = {
    snapshot: () => ({ id: 'snapshot' }),
    loadState: (payload) => {
      calls.push({ method: 'loadState', payload });
      return { ok: true };
    },
    reset: () => calls.push({ method: 'reset' }),
    setScenario: (scenarioId) => calls.push({ method: 'setScenario', scenarioId }),
    setBalanceProfile: (balanceProfileId) => calls.push({ method: 'setBalanceProfile', balanceProfileId }),
  };
  const renderer = {
    setRendererMode: (mode) => {
      calls.push({ method: 'setRendererMode', mode });
      return true;
    },
    getRendererMode: () => 'three',
  };
  const ui = {
    setSelectedBuildType: (value) => calls.push({ method: 'setSelectedBuildType', value }),
    attachRenderer: (value) => calls.push({ method: 'attachRenderer', value }),
  };
  const notify = (payload) => notifications.push(payload);
  return {
    calls,
    notifications,
    engine,
    renderer,
    ui,
    notify,
  };
}

test('persistence callbacks save/export state and emit success notifications', () => {
  const harness = createHarness();
  const depsCalls = [];
  const callbacks = createMainPersistenceCallbacks(harness, {
    saveSnapshot: (payload) => depsCalls.push({ method: 'saveSnapshot', payload }),
    exportSnapshot: (payload) => depsCalls.push({ method: 'exportSnapshot', payload }),
  });

  callbacks.onSave();
  callbacks.onExport();

  assert.deepEqual(depsCalls, [
    { method: 'saveSnapshot', payload: { id: 'snapshot' } },
    { method: 'exportSnapshot', payload: { id: 'snapshot' } },
  ]);
  assert.deepEqual(harness.notifications, [
    { kind: 'success', message: 'Game saved.' },
    { kind: 'success', message: 'Save exported to file.' },
  ]);
});

test('onLoad validates save payload and resets selected build on success', () => {
  const harness = createHarness();
  const callbacks = createMainPersistenceCallbacks(harness, {
    loadSnapshot: () => ({ id: 'loaded' }),
    validateSnapshot: () => ({ ok: true }),
  });

  callbacks.onLoad();

  assert.deepEqual(harness.calls, [
    { method: 'loadState', payload: { id: 'loaded' } },
    { method: 'setSelectedBuildType', value: null },
  ]);
  assert.deepEqual(harness.notifications, []);
});

test('onLoad emits validation and load errors', () => {
  const harness = createHarness();
  const callbacksNoSave = createMainPersistenceCallbacks(harness, {
    loadSnapshot: () => null,
  });
  callbacksNoSave.onLoad();

  const callbacksInvalid = createMainPersistenceCallbacks(harness, {
    loadSnapshot: () => ({ id: 'loaded' }),
    validateSnapshot: () => ({ ok: false, errors: ['bad save'] }),
  });
  callbacksInvalid.onLoad();

  const callbacksLoadFailure = createMainPersistenceCallbacks({
    ...harness,
    engine: {
      ...harness.engine,
      loadState: () => ({ ok: false, message: 'load failed' }),
    },
  }, {
    loadSnapshot: () => ({ id: 'loaded' }),
    validateSnapshot: () => ({ ok: true }),
  });
  callbacksLoadFailure.onLoad();

  assert.deepEqual(harness.notifications, [
    { kind: 'error', message: 'No save found.' },
    { kind: 'error', message: 'Save invalid: bad save' },
    { kind: 'error', message: 'Failed to load save: load failed' },
  ]);
});

test('onImport handles success, validation failure, load failure, and thrown errors', async () => {
  const harness = createHarness();
  const callbacksSuccess = createMainPersistenceCallbacks(harness, {
    importSnapshot: async () => ({ id: 'imported' }),
    validateSnapshot: () => ({ ok: true }),
  });
  await callbacksSuccess.onImport({ name: 'save.json' });

  const callbacksInvalid = createMainPersistenceCallbacks(harness, {
    importSnapshot: async () => ({ id: 'imported' }),
    validateSnapshot: () => ({ ok: false, errors: ['invalid imported'] }),
  });
  await callbacksInvalid.onImport({ name: 'save.json' });

  const callbacksLoadFailure = createMainPersistenceCallbacks({
    ...harness,
    engine: {
      ...harness.engine,
      loadState: () => ({ ok: false, message: 'cannot import' }),
    },
  }, {
    importSnapshot: async () => ({ id: 'imported' }),
    validateSnapshot: () => ({ ok: true }),
  });
  await callbacksLoadFailure.onImport({ name: 'save.json' });

  const callbacksThrow = createMainPersistenceCallbacks(harness, {
    importSnapshot: async () => {
      throw new Error('boom');
    },
  });
  await callbacksThrow.onImport({ name: 'save.json' });

  assert.deepEqual(harness.notifications, [
    { kind: 'success', message: 'Save imported successfully.' },
    { kind: 'error', message: 'Imported save invalid: invalid imported' },
    { kind: 'error', message: 'Failed to load imported save: cannot import' },
    { kind: 'error', message: 'boom' },
  ]);
});

test('reset/scenario/profile and renderer callbacks delegate to engine/ui/renderer', () => {
  const harness = createHarness();
  const callbacks = createMainPersistenceCallbacks(harness, {
    clearSnapshot: () => harness.calls.push({ method: 'clearSnapshot' }),
  });

  callbacks.onReset();
  callbacks.onScenarioChange('mountains');
  callbacks.onBalanceProfileChange('forgiving');
  const switched = callbacks.onRendererModeChange('three');

  assert.equal(switched, true);
  assert.deepEqual(harness.calls, [
    { method: 'clearSnapshot' },
    { method: 'reset' },
    { method: 'setSelectedBuildType', value: null },
    { method: 'setScenario', scenarioId: 'mountains' },
    { method: 'setSelectedBuildType', value: null },
    { method: 'setBalanceProfile', balanceProfileId: 'forgiving' },
    { method: 'setSelectedBuildType', value: null },
    { method: 'setRendererMode', mode: 'three' },
    { method: 'attachRenderer', value: harness.renderer },
  ]);
  assert.deepEqual(harness.notifications, [
    { kind: 'success', message: 'Renderer switched to three.' },
  ]);
});
