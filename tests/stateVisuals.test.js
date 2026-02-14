import test from 'node:test';
import assert from 'node:assert/strict';
import { getDaylightFactor, getResourceGains, getSeasonTint } from '../src/render/stateVisuals.js';

test('getDaylightFactor oscillates between night and day bounds', () => {
  const midnight = getDaylightFactor(0);
  const midday = getDaylightFactor(12);
  assert.ok(midnight >= 0 && midnight <= 1);
  assert.ok(midday >= 0 && midday <= 1);
  assert.ok(midday > midnight);
});

test('getSeasonTint maps day ranges to expected palette overlays', () => {
  assert.equal(getSeasonTint(5), 'rgba(82, 156, 94, 0.08)');
  assert.equal(getSeasonTint(80), 'rgba(178, 134, 66, 0.1)');
  assert.equal(getSeasonTint(45), 'rgba(0, 0, 0, 0)');
});

test('getResourceGains returns deltas above threshold only', () => {
  const gains = getResourceGains(
    { wood: 52, stone: 19, food: 40 },
    { wood: 48, stone: 18, food: 38 },
    3,
  );

  assert.deepEqual(gains, [{ resource: 'wood', delta: 4 }]);
  assert.deepEqual(getResourceGains({ wood: 2 }, null, 3), []);
});

