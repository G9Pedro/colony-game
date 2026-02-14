import test from 'node:test';
import assert from 'node:assert/strict';
import { bindUIGlobalActions } from '../src/ui/uiGlobalActionBindings.js';

function createEventElement() {
  const listeners = new Map();
  return {
    listeners,
    addEventListener(type, handler) {
      listeners.set(type, handler);
    },
    async trigger(type, event = { target: {} }) {
      const handler = listeners.get(type);
      if (!handler) {
        return;
      }
      await handler(event);
    },
  };
}

function createElements() {
  const importFileInput = createEventElement();
  let importClicks = 0;
  importFileInput.click = () => {
    importClicks += 1;
  };

  return {
    elements: {
      pauseBtn: createEventElement(),
      speedButtons: [createEventElement(), createEventElement(), createEventElement()],
      hireBtn: createEventElement(),
      saveBtn: createEventElement(),
      loadBtn: createEventElement(),
      exportBtn: createEventElement(),
      importBtn: createEventElement(),
      importFileInput,
      resetBtn: createEventElement(),
      scenarioSelect: createEventElement(),
      balanceProfileSelect: createEventElement(),
      rendererModeSelect: createEventElement(),
    },
    getImportClicks: () => importClicks,
  };
}

test('bindUIGlobalActions wires engine/callback actions and notifications', async () => {
  const { elements, getImportClicks } = createElements();
  const speeds = [];
  const engine = {
    togglePauseCalls: 0,
    togglePause() {
      this.togglePauseCalls += 1;
    },
    setSpeed(value) {
      speeds.push(value);
    },
    hireColonist() {
      return { ok: false, message: 'No housing' };
    },
  };
  const callbackCalls = [];
  const importCalls = [];
  let callbacks = {
    onSave: () => callbackCalls.push('save:1'),
    onLoad: () => callbackCalls.push('load:1'),
    onExport: () => callbackCalls.push('export:1'),
    onImport: async (file) => importCalls.push(file.name),
    onReset: () => callbackCalls.push('reset:1'),
    onScenarioChange: (value) => callbackCalls.push(`scenario:${value}`),
    onBalanceProfileChange: (value) => callbackCalls.push(`balance:${value}`),
    onRendererModeChange: (value) => {
      callbackCalls.push(`renderer:${value}`);
      return false;
    },
  };
  const notifications = [];

  bindUIGlobalActions({
    elements,
    engine,
    getCallbacks: () => callbacks,
    pushNotification: (payload) => notifications.push(payload),
  });

  await elements.pauseBtn.trigger('click');
  await elements.speedButtons[0].trigger('click');
  await elements.speedButtons[1].trigger('click');
  await elements.speedButtons[2].trigger('click');
  await elements.hireBtn.trigger('click');
  await elements.saveBtn.trigger('click');
  await elements.loadBtn.trigger('click');
  await elements.exportBtn.trigger('click');
  await elements.importBtn.trigger('click');
  const importEvent = { target: { files: [{ name: 'save.json' }], value: 'chosen' } };
  await elements.importFileInput.trigger('change', importEvent);
  await elements.resetBtn.trigger('click');
  await elements.scenarioSelect.trigger('change', { target: { value: 'mountain' } });
  await elements.balanceProfileSelect.trigger('change', { target: { value: 'hard' } });
  await elements.rendererModeSelect.trigger('change', { target: { value: 'three' } });

  callbacks = {
    ...callbacks,
    onSave: () => callbackCalls.push('save:2'),
  };
  await elements.saveBtn.trigger('click');

  assert.equal(engine.togglePauseCalls, 1);
  assert.deepEqual(speeds, [1, 2, 4]);
  assert.equal(getImportClicks(), 1);
  assert.equal(importEvent.target.value, '');
  assert.deepEqual(importCalls, ['save.json']);
  assert.deepEqual(callbackCalls, [
    'save:1',
    'load:1',
    'export:1',
    'reset:1',
    'scenario:mountain',
    'balance:hard',
    'renderer:three',
    'save:2',
  ]);
  assert.deepEqual(notifications, [
    { kind: 'error', message: 'No housing' },
    { kind: 'warn', message: 'Requested renderer mode is unavailable. Falling back to isometric.' },
  ]);
});

test('bindUIGlobalActions ignores empty import selection', async () => {
  const { elements } = createElements();
  const imported = [];

  bindUIGlobalActions({
    elements,
    engine: {
      togglePause() {},
      setSpeed() {},
      hireColonist: () => ({ ok: true }),
    },
    getCallbacks: () => ({
      onSave: () => {},
      onLoad: () => {},
      onExport: () => {},
      onImport: async (file) => imported.push(file),
      onReset: () => {},
      onScenarioChange: () => {},
      onBalanceProfileChange: () => {},
      onRendererModeChange: () => true,
    }),
    pushNotification: () => {},
  });

  await elements.importFileInput.trigger('change', { target: { files: [] } });
  assert.deepEqual(imported, []);
});

