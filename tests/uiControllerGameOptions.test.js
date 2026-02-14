import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyUIControllerBalanceProfileOptions,
  applyUIControllerScenarioOptions,
} from '../src/ui/uiControllerGameOptions.js';

function createControllerStub() {
  const calls = [];
  return {
    calls,
    gameUI: {
      setScenarioOptions: (scenarios, currentScenarioId) =>
        calls.push({ method: 'setScenarioOptions', scenarios, currentScenarioId }),
      setBalanceProfileOptions: (profiles, currentProfileId) =>
        calls.push({ method: 'setBalanceProfileOptions', profiles, currentProfileId }),
    },
  };
}

test('applyUIControllerScenarioOptions delegates to game UI scenario setter', () => {
  const controller = createControllerStub();
  const scenarios = [{ id: 'default', name: 'Default' }];

  applyUIControllerScenarioOptions(controller, scenarios, 'default');

  assert.deepEqual(controller.calls, [
    { method: 'setScenarioOptions', scenarios, currentScenarioId: 'default' },
  ]);
});

test('applyUIControllerBalanceProfileOptions delegates to game UI balance setter', () => {
  const controller = createControllerStub();
  const profiles = [{ id: 'hard', name: 'Hard' }];

  applyUIControllerBalanceProfileOptions(controller, profiles, 'hard');

  assert.deepEqual(controller.calls, [
    { method: 'setBalanceProfileOptions', profiles, currentProfileId: 'hard' },
  ]);
});

