import test from 'node:test';
import assert from 'node:assert/strict';
import {
  dispatchGameUIResourceBar,
  dispatchGameUIResourceRateSampling,
  dispatchGameUISpeedButtons,
  dispatchGameUITopState,
} from '../src/ui/gameUIHudDispatch.js';

function createGameUIStub() {
  return {
    el: {
      resourceList: { innerHTML: '' },
      speedButtons: [],
    },
    resourceDefinitions: [{ id: 'wood' }],
    valueAnimator: { tweenValue: () => 1 },
    spriteFactory: { getResourceIcon: () => ({}) },
    resourceFlowTracker: {
      sample: () => ({ wood: 1 }),
    },
    resourceRates: { wood: 0 },
  };
}

test('dispatchGameUIResourceRateSampling stores sampled rates on game UI', () => {
  const gameUI = createGameUIStub();
  const state = { resources: { wood: 3 }, timeSeconds: 20 };
  const calls = [];

  const rates = dispatchGameUIResourceRateSampling(gameUI, state, {
    sampleRates: (resources, timeSeconds) => {
      calls.push({ resources, timeSeconds });
      return { wood: 4 };
    },
  });

  assert.deepEqual(calls, [{ resources: state.resources, timeSeconds: 20 }]);
  assert.deepEqual(rates, { wood: 4 });
  assert.deepEqual(gameUI.resourceRates, { wood: 4 });
});

test('dispatchGameUITopState forwards normalized top-bar payload', () => {
  const gameUI = createGameUIStub();
  const state = { speed: 2 };
  const calls = [];

  dispatchGameUITopState(gameUI, state, {
    populationText: '5 / 10',
    morale: '75',
    storageText: '20 / 80',
  }, {
    renderTopState: (payload) => calls.push(payload),
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].elements, gameUI.el);
  assert.equal(calls[0].state, state);
  assert.equal(calls[0].populationText, '5 / 10');
  assert.equal(calls[0].morale, '75');
  assert.equal(calls[0].storageText, '20 / 80');
  assert.equal(typeof calls[0].buildClockLabel, 'function');
  assert.equal(typeof calls[0].buildPauseButtonLabel, 'function');
});

test('dispatchGameUISpeedButtons forwards speed state payload', () => {
  const gameUI = createGameUIStub();
  const state = { speed: 4 };
  const calls = [];

  dispatchGameUISpeedButtons(gameUI, state, {
    renderSpeedButtons: (payload) => calls.push(payload),
  });

  assert.deepEqual(calls.map((call) => call.speed), [4]);
  assert.equal(calls[0].elements, gameUI.el);
  assert.equal(typeof calls[0].buildSpeedButtonStates, 'function');
});

test('dispatchGameUIResourceBar samples rates and renders resource bar payload', () => {
  const gameUI = createGameUIStub();
  const state = { resources: { wood: 10 }, timeSeconds: 5 };
  const sampleCalls = [];
  const renderCalls = [];

  dispatchGameUIResourceBar(gameUI, state, {
    sampleRates: (target, payload) => {
      sampleCalls.push({ target, payload });
      target.resourceRates = { wood: 2 };
    },
    renderResourceBar: (payload) => renderCalls.push(payload),
    resourceRowsBuilder: () => [],
    resourceChipBuilder: () => ({}),
    rateFormatter: () => '+2',
  });

  assert.deepEqual(sampleCalls, [{ target: gameUI, payload: state }]);
  assert.equal(renderCalls.length, 1);
  const [payload] = renderCalls;
  assert.equal(payload.elements, gameUI.el);
  assert.equal(payload.resourceDefinitions, gameUI.resourceDefinitions);
  assert.equal(payload.resources, state.resources);
  assert.deepEqual(payload.resourceRates, { wood: 2 });
  assert.equal(payload.valueAnimator, gameUI.valueAnimator);
  assert.equal(payload.spriteFactory, gameUI.spriteFactory);
});

