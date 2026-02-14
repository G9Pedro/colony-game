import test from 'node:test';
import assert from 'node:assert/strict';
import { canAffordBuildingCost, getBuildingCardState } from '../src/ui/buildingAvailability.js';

test('canAffordBuildingCost checks each resource requirement', () => {
  assert.equal(canAffordBuildingCost({ wood: 20, stone: 10 }, { wood: 10, stone: 10 }), true);
  assert.equal(canAffordBuildingCost({ wood: 9, stone: 10 }, { wood: 10, stone: 10 }), false);
});

test('getBuildingCardState returns locked subtitle when tech missing', () => {
  const state = { resources: { wood: 99 } };
  const definition = {
    requiredTech: 'masonry',
    buildTime: 20,
    cost: { wood: 10 },
  };
  const card = getBuildingCardState(
    state,
    definition,
    () => false,
    () => '10 wood',
  );
  assert.deepEqual(card, {
    unlocked: false,
    canAfford: true,
    subtitle: 'Requires masonry',
    warning: false,
  });
});

test('getBuildingCardState marks warning when unlocked but unaffordable', () => {
  const state = { resources: { wood: 5 } };
  const definition = {
    requiredTech: null,
    buildTime: 20,
    cost: { wood: 10 },
  };
  const card = getBuildingCardState(
    state,
    definition,
    () => true,
    () => '10 wood',
  );
  assert.deepEqual(card, {
    unlocked: true,
    canAfford: false,
    subtitle: '20s · 10 wood',
    warning: true,
  });
});

