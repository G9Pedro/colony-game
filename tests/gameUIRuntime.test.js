import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameUIRuntime } from '../src/ui/gameUIRuntime.js';

test('createGameUIRuntime builds animator and flow tracker with defaults', () => {
  const runtime = createGameUIRuntime();

  assert.equal(typeof runtime.valueAnimator, 'object');
  assert.equal(typeof runtime.resourceFlowTracker, 'object');
  assert.deepEqual(runtime.resourceRates, {});
});

test('createGameUIRuntime supports dependency injection for deterministic setup', () => {
  const calls = [];
  class AnimationManagerMock {
    constructor() {
      this.kind = 'animation';
      calls.push({ method: 'animation' });
    }
  }
  class ResourceFlowTrackerMock {
    constructor(options) {
      this.options = options;
      calls.push({ method: 'flow', options });
    }
  }

  const runtime = createGameUIRuntime({
    dependencies: {
      AnimationManagerClass: AnimationManagerMock,
      ResourceFlowTrackerClass: ResourceFlowTrackerMock,
    },
  });

  assert.equal(runtime.valueAnimator.kind, 'animation');
  assert.deepEqual(runtime.resourceFlowTracker.options, {
    minElapsedSeconds: 1.2,
    hoursPerDay: 24,
  });
  assert.deepEqual(calls, [
    { method: 'animation' },
    { method: 'flow', options: { minElapsedSeconds: 1.2, hoursPerDay: 24 } },
  ]);
});

