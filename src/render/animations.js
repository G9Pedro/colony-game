function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

export function easeOutCubic(t) {
  const clamped = clamp(t);
  return 1 - ((1 - clamped) ** 3);
}

export function easeOutBack(t) {
  const clamped = clamp(t);
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * ((clamped - 1) ** 3) + c1 * ((clamped - 1) ** 2);
}

export class AnimationManager {
  constructor() {
    this.placementTweens = new Map();
    this.valueTweens = new Map();
  }

  registerPlacement(entityId, startAt = performance.now(), duration = 300) {
    this.placementTweens.set(entityId, {
      startAt,
      duration,
    });
  }

  getPlacementScale(entityId, now = performance.now()) {
    const tween = this.placementTweens.get(entityId);
    if (!tween) {
      return 1;
    }
    const progress = clamp((now - tween.startAt) / tween.duration);
    if (progress >= 1) {
      this.placementTweens.delete(entityId);
      return 1;
    }
    return easeOutBack(progress);
  }

  getSelectionPulse(now = performance.now(), speed = 0.0032) {
    return 0.45 + (Math.sin(now * speed) + 1) * 0.28;
  }

  tweenValue(key, value, now = performance.now(), duration = 260) {
    const tween = this.valueTweens.get(key);
    if (!tween) {
      this.valueTweens.set(key, {
        from: value,
        to: value,
        startedAt: now,
        duration,
      });
      return value;
    }

    if (Math.abs(tween.to - value) > 0.001) {
      const currentValue = this.getTweenedValue(key, now);
      this.valueTweens.set(key, {
        from: currentValue,
        to: value,
        startedAt: now,
        duration,
      });
      return currentValue;
    }
    return this.getTweenedValue(key, now);
  }

  getTweenedValue(key, now = performance.now()) {
    const tween = this.valueTweens.get(key);
    if (!tween) {
      return 0;
    }
    const progress = clamp((now - tween.startedAt) / tween.duration);
    if (progress >= 1) {
      this.valueTweens.set(key, {
        from: tween.to,
        to: tween.to,
        startedAt: now,
        duration: tween.duration,
      });
      return tween.to;
    }
    const eased = easeOutCubic(progress);
    return tween.from + (tween.to - tween.from) * eased;
  }
}

