function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export class FrameQualityController {
  constructor({
    enabled = true,
    targetFps = 60,
    lowThreshold = 44,
    highThreshold = 56,
    minQuality = 0.45,
    maxQuality = 1,
    adjustIntervalSeconds = 0.8,
  } = {}) {
    this.enabled = enabled;
    this.targetFps = targetFps;
    this.lowThreshold = lowThreshold;
    this.highThreshold = highThreshold;
    this.minQuality = minQuality;
    this.maxQuality = maxQuality;
    this.adjustIntervalSeconds = adjustIntervalSeconds;
    this.quality = maxQuality;
    this.accumulatedSeconds = 0;
    this.accumulatedFrames = 0;
  }

  recordFrame(deltaSeconds) {
    if (!this.enabled) {
      return this.quality;
    }
    if (!Number.isFinite(deltaSeconds) || deltaSeconds <= 0) {
      return this.quality;
    }

    this.accumulatedSeconds += deltaSeconds;
    this.accumulatedFrames += 1;
    if (this.accumulatedSeconds < this.adjustIntervalSeconds) {
      return this.quality;
    }

    const fps = this.accumulatedFrames / this.accumulatedSeconds;
    if (fps < this.lowThreshold) {
      this.quality = clamp(this.quality - 0.08, this.minQuality, this.maxQuality);
    } else if (fps > this.highThreshold) {
      this.quality = clamp(this.quality + 0.04, this.minQuality, this.maxQuality);
    }

    this.accumulatedSeconds = 0;
    this.accumulatedFrames = 0;
    return this.quality;
  }

  getQuality() {
    return this.quality;
  }

  getParticleMultiplier() {
    return clamp(this.quality, 0.35, 1);
  }

  shouldRunOptionalEffects() {
    return this.quality >= 0.55;
  }
}

