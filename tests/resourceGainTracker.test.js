import test from 'node:test';
import assert from 'node:assert/strict';
import { ResourceGainTracker } from '../src/render/resourceGainTracker.js';

test('ResourceGainTracker initializes baseline without emitting gains', () => {
  const tracker = new ResourceGainTracker({ cooldownSeconds: 1, minDelta: 3 });
  const first = tracker.sample({ wood: 10, stone: 5 }, 1);
  assert.deepEqual(first, []);
});

test('ResourceGainTracker respects cooldown and reports thresholded gains', () => {
  const tracker = new ResourceGainTracker({ cooldownSeconds: 1, minDelta: 3 });
  tracker.sample({ wood: 10, stone: 5 }, 1);

  const duringCooldown = tracker.sample({ wood: 20, stone: 9 }, 0.2);
  assert.deepEqual(duringCooldown, []);

  const afterCooldown = tracker.sample({ wood: 20, stone: 9 }, 1);
  assert.deepEqual(afterCooldown, [
    { resource: 'wood', delta: 10 },
    { resource: 'stone', delta: 4 },
  ]);
});

test('ResourceGainTracker reset clears baseline and cooldown', () => {
  const tracker = new ResourceGainTracker({ cooldownSeconds: 1, minDelta: 2 });
  tracker.sample({ food: 5 }, 1);
  tracker.reset();
  assert.deepEqual(tracker.sample({ food: 8 }, 0), []);
});

