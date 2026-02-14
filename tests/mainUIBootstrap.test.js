import test from 'node:test';
import assert from 'node:assert/strict';
import { bootstrapMainUI } from '../src/mainUIBootstrap.js';

test('bootstrapMainUI attaches renderer and sets mode/scenario/profile options', () => {
  const calls = [];
  const ui = {
    attachRenderer: (renderer) => calls.push({ method: 'attachRenderer', renderer }),
    setRendererModeOptions: (modes, mode) => calls.push({ method: 'setRendererModeOptions', modes, mode }),
    setScenarioOptions: (options, selected) => calls.push({ method: 'setScenarioOptions', options, selected }),
    setBalanceProfileOptions: (options, selected) => calls.push({
      method: 'setBalanceProfileOptions',
      options,
      selected,
    }),
  };
  const renderer = {
    getAvailableModes: () => ['isometric', 'three'],
    getRendererMode: () => 'three',
  };
  const engine = {
    state: {
      scenarioId: 'mountains',
      balanceProfileId: 'forgiving',
    },
  };
  const scenarioDefinitions = {
    mountains: { id: 'mountains' },
    valley: { id: 'valley' },
  };
  const balanceProfileDefinitions = {
    forgiving: { id: 'forgiving' },
    brutal: { id: 'brutal' },
  };

  bootstrapMainUI({
    ui,
    renderer,
    engine,
    scenarioDefinitions,
    balanceProfileDefinitions,
  });

  assert.deepEqual(calls, [
    { method: 'attachRenderer', renderer },
    { method: 'setRendererModeOptions', modes: ['isometric', 'three'], mode: 'three' },
    {
      method: 'setScenarioOptions',
      options: [{ id: 'mountains' }, { id: 'valley' }],
      selected: 'mountains',
    },
    {
      method: 'setBalanceProfileOptions',
      options: [{ id: 'forgiving' }, { id: 'brutal' }],
      selected: 'forgiving',
    },
  ]);
});

test('bootstrapMainUI falls back to isometric mode defaults when renderer getters are missing', () => {
  const calls = [];
  const ui = {
    attachRenderer: () => {},
    setRendererModeOptions: (modes, mode) => calls.push({ modes, mode }),
    setScenarioOptions: () => {},
    setBalanceProfileOptions: () => {},
  };

  bootstrapMainUI({
    ui,
    renderer: {},
    engine: {
      state: {
        scenarioId: 'scenario',
        balanceProfileId: 'profile',
      },
    },
    scenarioDefinitions: { scenario: { id: 'scenario' } },
    balanceProfileDefinitions: { profile: { id: 'profile' } },
  });

  assert.deepEqual(calls, [{ modes: ['isometric'], mode: 'isometric' }]);
});
