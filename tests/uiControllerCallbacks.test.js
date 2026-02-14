import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyUIControllerPersistenceCallbacks,
  mergeUIControllerCallbacks,
} from '../src/ui/uiControllerCallbacks.js';

test('mergeUIControllerCallbacks overlays updates onto current callbacks', () => {
  const oldSave = () => 'old';
  const newSave = () => 'new';
  const callbacks = mergeUIControllerCallbacks(
    { onSave: oldSave, onLoad: () => 'load' },
    { onSave: newSave },
  );

  assert.equal(callbacks.onSave, newSave);
  assert.equal(callbacks.onLoad(), 'load');
});

test('applyUIControllerPersistenceCallbacks updates controller callback registry', () => {
  const oldReset = () => 'old-reset';
  const newReset = () => 'new-reset';
  const controller = {
    callbacks: {
      onSave: () => 'save',
      onReset: oldReset,
    },
  };

  applyUIControllerPersistenceCallbacks(controller, { onReset: newReset });

  assert.equal(controller.callbacks.onSave(), 'save');
  assert.equal(controller.callbacks.onReset, newReset);
});

