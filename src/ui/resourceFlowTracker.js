export class ResourceFlowTracker {
  constructor({ minElapsedSeconds = 1.2, hoursPerDay = 24 } = {}) {
    this.minElapsedSeconds = minElapsedSeconds;
    this.hoursPerDay = hoursPerDay;
    this.baselineValues = null;
    this.baselineTimeSeconds = 0;
    this.rates = {};
  }

  sample(resources, timeSeconds) {
    if (!this.baselineValues) {
      this.baselineValues = { ...resources };
      this.baselineTimeSeconds = timeSeconds;
      return this.rates;
    }

    const elapsed = timeSeconds - this.baselineTimeSeconds;
    if (elapsed < this.minElapsedSeconds) {
      return this.rates;
    }

    const nextRates = {};
    Object.keys(resources).forEach((resource) => {
      const delta = resources[resource] - (this.baselineValues[resource] ?? resources[resource]);
      nextRates[resource] = (delta / elapsed) * this.hoursPerDay;
    });
    this.baselineValues = { ...resources };
    this.baselineTimeSeconds = timeSeconds;
    this.rates = nextRates;
    return this.rates;
  }

  reset() {
    this.baselineValues = null;
    this.baselineTimeSeconds = 0;
    this.rates = {};
  }
}

