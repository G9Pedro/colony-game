import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMainEngineOptions, parseMainLaunchParams } from '../src/mainLaunchOptions.js';

test('parseMainLaunchParams reads seed/scenario/balance from query string', () => {
  const params = parseMainLaunchParams('?seed=abc123&scenario=mountains&balance=forgiving');
  assert.deepEqual(params, {
    seed: 'abc123',
    scenarioId: 'mountains',
    balanceProfileId: 'forgiving',
  });
});

test('parseMainLaunchParams returns nulls when parameters are missing', () => {
  const params = parseMainLaunchParams('');
  assert.deepEqual(params, {
    seed: null,
    scenarioId: null,
    balanceProfileId: null,
  });
});

test('buildMainEngineOptions includes only truthy launch options', () => {
  const options = buildMainEngineOptions({
    seed: 'seed-1',
    scenarioId: null,
    balanceProfileId: 'brutal',
  });
  assert.deepEqual(options, {
    seed: 'seed-1',
    balanceProfileId: 'brutal',
  });
});
