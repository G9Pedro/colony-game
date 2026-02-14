import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyUIControllerSelectedBuildType,
  applyUIControllerSelectedEntity,
  attachUIRenderer,
  hideUIControllerBanner,
  pushUIControllerNotification,
  showUIControllerBanner,
} from '../src/ui/uiControllerState.js';

function createControllerStub() {
  const calls = [];
  return {
    selectedEntity: null,
    selectedBuildType: null,
    renderer: null,
    notifications: {
      push: (payload) => calls.push({ method: 'pushNotification', payload }),
    },
    el: {
      rendererModeSelect: { value: '' },
      messageBanner: {
        textContent: '',
        classList: {
          add: (name) => calls.push({ method: 'classList.add', name }),
          remove: (name) => calls.push({ method: 'classList.remove', name }),
        },
      },
    },
    calls,
  };
}

test('attachUIRenderer syncs renderer and selected mode', () => {
  const controller = createControllerStub();
  const renderer = { getRendererMode: () => 'three' };

  attachUIRenderer(controller, renderer);

  assert.equal(controller.renderer, renderer);
  assert.equal(controller.el.rendererModeSelect.value, 'three');
});

test('attachUIRenderer falls back to isometric when mode getter is absent', () => {
  const controller = createControllerStub();
  const renderer = {};

  attachUIRenderer(controller, renderer);

  assert.equal(controller.el.rendererModeSelect.value, 'isometric');
});

test('ui controller selected state helpers update selected entity/build type', () => {
  const controller = createControllerStub();
  const entity = { id: 'hut-1' };

  applyUIControllerSelectedEntity(controller, entity);
  applyUIControllerSelectedBuildType(controller, 'farm');

  assert.equal(controller.selectedEntity, entity);
  assert.equal(controller.selectedBuildType, 'farm');
});

test('showUIControllerBanner updates content and clears hidden class', () => {
  const controller = createControllerStub();

  showUIControllerBanner(controller, 'Paused');

  assert.equal(controller.el.messageBanner.textContent, 'Paused');
  assert.deepEqual(controller.calls, [{ method: 'classList.remove', name: 'hidden' }]);
});

test('hideUIControllerBanner adds hidden class', () => {
  const controller = createControllerStub();

  hideUIControllerBanner(controller);

  assert.deepEqual(controller.calls, [{ method: 'classList.add', name: 'hidden' }]);
});

test('pushUIControllerNotification enqueues toast payload', () => {
  const controller = createControllerStub();
  const payload = { message: 'Saved' };

  pushUIControllerNotification(controller, payload);

  assert.deepEqual(controller.calls, [{ method: 'pushNotification', payload }]);
});

