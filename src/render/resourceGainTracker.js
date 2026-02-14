import { getResourceGains } from './stateVisuals.js';

export class ResourceGainTracker {
  constructor({ cooldownSeconds = 1.1, minDelta = 3 } = {}) {
    this.cooldownSeconds = cooldownSeconds;
    this.minDelta = minDelta;
    this.cooldownRemaining = 0;
    this.previousResources = null;
  }

  sample(resources, deltaSeconds) {
    this.cooldownRemaining -= deltaSeconds;
    if (this.cooldownRemaining > 0) {
      return [];
    }
    this.cooldownRemaining = this.cooldownSeconds;

    if (!this.previousResources) {
      this.previousResources = { ...resources };
      return [];
    }

    const gains = getResourceGains(resources, this.previousResources, this.minDelta);
    this.previousResources = { ...resources };
    return gains;
  }

  reset() {
    this.cooldownRemaining = 0;
    this.previousResources = null;
  }
}

