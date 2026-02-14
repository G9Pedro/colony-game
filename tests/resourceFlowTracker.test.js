import test from 'node:test';
import assert from 'node:assert/strict';
import { ResourceFlowTracker } from '../src/ui/resourceFlowTracker.js';

test('ResourceFlowTracker initializes baseline without rates', () => {
  const tracker = new ResourceFlowTracker({ minElapsedSeconds: 1.2, hoursPerDay: 24 });
  const first = tracker.sample({ wood: 10, food: 5 }, 2);
  assert.deepEqual(first, {});
});

test('ResourceFlowTracker emits per-day rates once elapsed threshold is reached', () => {
  const tracker = new ResourceFlowTracker({ minElapsedSeconds: 1.2, hoursPerDay: 24 });
  tracker.sample({ wood: 10, food: 5 }, 2);
  const beforeThreshold = tracker.sample({ wood: 16, food: 11 }, 2.5);
  assert.deepEqual(beforeThreshold, {});

  const rates = tracker.sample({ wood: 16, food: 11 }, 3.4);
  assert.ok(Math.abs(rates.wood - ((6 / 1.4) * 24)) < 0.000001);
  assert.ok(Math.abs(rates.food - ((6 / 1.4) * 24)) < 0.000001);
});

test('ResourceFlowTracker reset clears baseline and rates', () => {
  const tracker = new ResourceFlowTracker({ minElapsedSeconds: 1, hoursPerDay: 24 });
  tracker.sample({ stone: 8 }, 1);
  tracker.sample({ stone: 10 }, 2);
  tracker.reset();
  assert.deepEqual(tracker.sample({ stone: 10 }, 2), {});
});

