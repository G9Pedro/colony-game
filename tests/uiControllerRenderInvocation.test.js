import test from 'node:test';
import assert from 'node:assert/strict';
import { buildUiControllerRenderInvocation } from '../src/ui/uiControllerRenderInvocation.js';

test('buildUiControllerRenderInvocation maps controller runtime and delegates callbacks', () => {
  const calls = [];
  const controller = {
    selectedBuildType: 'hut',
    selectedEntity: { id: 2 },
    engine: { id: 'engine' },
    renderer: { id: 'renderer' },
    el: { id: 'elements' },
    gameUI: { id: 'game-ui' },
    minimap: { id: 'minimap' },
    pushNotification(payload) {
      calls.push({ method: 'pushNotification', payload });
    },
    showBanner(message) {
      calls.push({ method: 'showBanner', message });
    },
    hideBanner() {
      calls.push({ method: 'hideBanner' });
    },
  };
  const state = { tick: 12 };

  const invocation = buildUiControllerRenderInvocation(controller, state);

  assert.equal(invocation.state, state);
  assert.equal(invocation.selectedBuildType, 'hut');
  assert.equal(invocation.selectedEntity, controller.selectedEntity);
  assert.equal(invocation.engine, controller.engine);
  assert.equal(invocation.renderer, controller.renderer);
  assert.equal(invocation.elements, controller.el);
  assert.equal(invocation.gameUI, controller.gameUI);
  assert.equal(invocation.minimap, controller.minimap);

  invocation.pushNotification({ text: 'hello' });
  invocation.setSelectedBuildType('watchtower');
  invocation.showBanner('alert');
  invocation.hideBanner();

  assert.equal(controller.selectedBuildType, 'watchtower');
  assert.deepEqual(calls, [
    { method: 'pushNotification', payload: { text: 'hello' } },
    { method: 'showBanner', message: 'alert' },
    { method: 'hideBanner' },
  ]);
});

