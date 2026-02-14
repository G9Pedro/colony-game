import test from 'node:test';
import assert from 'node:assert/strict';
import { createUIControllerDefaultCallbacks, createUIControllerElements } from '../src/ui/uiControllerElements.js';

test('createUIControllerElements maps expected dom ids and speed button order', () => {
  const requestedIds = [];
  const documentObject = {
    getElementById(id) {
      requestedIds.push(id);
      return { id };
    },
  };

  const elements = createUIControllerElements(documentObject);

  assert.equal(elements.scenarioSelect.id, 'scenario-select');
  assert.equal(elements.balanceProfileSelect.id, 'balance-profile-select');
  assert.equal(elements.rendererModeSelect.id, 'renderer-mode-select');
  assert.deepEqual(
    elements.speedButtons.map((button) => button.id),
    ['speed-1-btn', 'speed-2-btn', 'speed-4-btn'],
  );
  assert.equal(elements.infoPanelTitle.id, 'info-panel-title');
  assert.equal(elements.infoPanelBody.id, 'info-panel-body');
  assert.equal(requestedIds.includes('notifications'), true);
  assert.equal(requestedIds.includes('minimap-canvas'), true);
});

test('createUIControllerDefaultCallbacks returns no-op callbacks and truthy mode switch response', async () => {
  const callbacks = createUIControllerDefaultCallbacks();

  assert.equal(typeof callbacks.onSave, 'function');
  assert.equal(typeof callbacks.onLoad, 'function');
  assert.equal(typeof callbacks.onExport, 'function');
  assert.equal(typeof callbacks.onImport, 'function');
  assert.equal(typeof callbacks.onReset, 'function');
  assert.equal(typeof callbacks.onScenarioChange, 'function');
  assert.equal(typeof callbacks.onBalanceProfileChange, 'function');
  assert.equal(typeof callbacks.onRendererModeChange, 'function');
  assert.equal(callbacks.onRendererModeChange(), true);
  await assert.doesNotReject(async () => callbacks.onImport());
});

