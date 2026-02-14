import test from 'node:test';
import assert from 'node:assert/strict';
import {
  handleHireColonistAction,
  handleImportFileChangeAction,
  handleRendererModeChangeAction,
} from '../src/ui/uiGlobalActionHandlers.js';

test('handleHireColonistAction pushes error notification when hire fails', () => {
  const notifications = [];
  const engine = {
    hireColonist: () => ({ ok: false, message: 'No housing' }),
  };

  handleHireColonistAction(engine, (payload) => notifications.push(payload));

  assert.deepEqual(notifications, [{ kind: 'error', message: 'No housing' }]);
});

test('handleHireColonistAction does nothing when hire succeeds', () => {
  const notifications = [];
  const engine = {
    hireColonist: () => ({ ok: true }),
  };

  handleHireColonistAction(engine, (payload) => notifications.push(payload));

  assert.deepEqual(notifications, []);
});

test('handleImportFileChangeAction imports selected file and clears input value', async () => {
  const imported = [];
  const event = {
    target: {
      files: [{ name: 'slot-1.json' }],
      value: 'picked',
    },
  };
  const getCallbacks = () => ({
    onImport: async (file) => imported.push(file.name),
  });

  await handleImportFileChangeAction(event, getCallbacks);

  assert.deepEqual(imported, ['slot-1.json']);
  assert.equal(event.target.value, '');
});

test('handleImportFileChangeAction ignores empty selections', async () => {
  const imported = [];
  const event = { target: { files: [] } };
  const getCallbacks = () => ({
    onImport: async (file) => imported.push(file),
  });

  await handleImportFileChangeAction(event, getCallbacks);

  assert.deepEqual(imported, []);
});

test('handleRendererModeChangeAction pushes warning on failed mode switch', () => {
  const notifications = [];
  const callbackCalls = [];
  const getCallbacks = () => ({
    onRendererModeChange: (value) => {
      callbackCalls.push(value);
      return false;
    },
  });

  handleRendererModeChangeAction('three', getCallbacks, (payload) => notifications.push(payload));

  assert.deepEqual(callbackCalls, ['three']);
  assert.deepEqual(notifications, [
    { kind: 'warn', message: 'Requested renderer mode is unavailable. Falling back to isometric.' },
  ]);
});

test('handleRendererModeChangeAction avoids warning on successful mode switch', () => {
  const notifications = [];
  const getCallbacks = () => ({
    onRendererModeChange: () => true,
  });

  handleRendererModeChangeAction('isometric', getCallbacks, (payload) => notifications.push(payload));

  assert.deepEqual(notifications, []);
});

