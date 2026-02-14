import { AnimationManager } from '../render/animations.js';
import { ResourceFlowTracker } from './resourceFlowTracker.js';

export function createGameUIRuntime({ dependencies = {} } = {}) {
  const {
    AnimationManagerClass = AnimationManager,
    ResourceFlowTrackerClass = ResourceFlowTracker,
  } = dependencies;
  return {
    valueAnimator: new AnimationManagerClass(),
    resourceFlowTracker: new ResourceFlowTrackerClass({
      minElapsedSeconds: 1.2,
      hoursPerDay: 24,
    }),
    resourceRates: {},
  };
}

