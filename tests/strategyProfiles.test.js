import test from 'node:test';
import assert from 'node:assert/strict';
import { getStrategyProfile } from '../src/content/strategyProfiles.js';
import { runStrategy } from '../scripts/simulationMatrix.js';

test('getStrategyProfile falls back to baseline for unknown id', () => {
  const baseline = getStrategyProfile('baseline');
  const fallback = getStrategyProfile('non-existent-profile');
  assert.equal(fallback.id, baseline.id);
  assert.equal(Array.isArray(fallback.buildActions), true);
});

test('runStrategy accepts explicit strategy overrides', () => {
  const summary = runStrategy('frontier', 'custom-strategy-seed', {
    strategyProfileId: 'baseline',
    steps: 40,
    buildPlan: [],
    hireSteps: [],
    researchActions: [],
  });

  assert.equal(summary.status, 'playing');
  assert.equal(summary.balanceProfileId, 'standard');
  assert.ok(summary.day >= 1);
});
