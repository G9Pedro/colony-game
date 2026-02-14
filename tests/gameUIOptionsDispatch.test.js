import test from 'node:test';
import assert from 'node:assert/strict';
import { dispatchGameUIBalanceProfileOptions, dispatchGameUIScenarioOptions } from '../src/ui/gameUIOptionsDispatch.js';

function createGameUIStub() {
  return {
    el: {
      scenarioSelect: { id: 'scenario-select' },
      balanceProfileSelect: { id: 'balance-profile-select' },
    },
  };
}

test('dispatchGameUIScenarioOptions maps scenario dropdown payload', () => {
  const gameUI = createGameUIStub();
  const scenarios = [{ id: 'calm', name: 'Calm Valley' }];
  const optionRowsBuilder = () => [];
  const selectOptionsRenderer = () => {};
  const calls = [];

  dispatchGameUIScenarioOptions(gameUI, scenarios, 'calm', {
    optionRowsBuilder,
    selectOptionsRenderer,
    renderDropdown: (payload) => calls.push(payload),
  });

  assert.equal(calls.length, 1);
  const [payload] = calls;
  assert.equal(payload.selectElement, gameUI.el.scenarioSelect);
  assert.equal(payload.options, scenarios);
  assert.equal(payload.selectedId, 'calm');
  assert.equal(payload.buildSelectOptionRows, optionRowsBuilder);
  assert.equal(payload.renderSelectOptions, selectOptionsRenderer);
  assert.equal(payload.getId(scenarios[0]), 'calm');
  assert.equal(payload.getLabel(scenarios[0]), 'Calm Valley');
});

test('dispatchGameUIBalanceProfileOptions maps balance profile dropdown payload', () => {
  const gameUI = createGameUIStub();
  const profiles = [{ id: 'forgiving', name: 'Forgiving' }];
  const optionRowsBuilder = () => [];
  const selectOptionsRenderer = () => {};
  const calls = [];

  dispatchGameUIBalanceProfileOptions(gameUI, profiles, 'forgiving', {
    optionRowsBuilder,
    selectOptionsRenderer,
    renderDropdown: (payload) => calls.push(payload),
  });

  assert.equal(calls.length, 1);
  const [payload] = calls;
  assert.equal(payload.selectElement, gameUI.el.balanceProfileSelect);
  assert.equal(payload.options, profiles);
  assert.equal(payload.selectedId, 'forgiving');
  assert.equal(payload.buildSelectOptionRows, optionRowsBuilder);
  assert.equal(payload.renderSelectOptions, selectOptionsRenderer);
  assert.equal(payload.getId(profiles[0]), 'forgiving');
  assert.equal(payload.getLabel(profiles[0]), 'Forgiving');
});

