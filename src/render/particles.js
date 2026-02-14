import {
  buildParticleSystemRenderables,
  dispatchParticleSystemBurst,
  dispatchParticleSystemFloatingText,
  dispatchParticleSystemQuality,
  dispatchParticleSystemUpdate,
} from './particleSystemDispatch.js';
import { createParticleSystemRuntimeState } from './particleSystemRuntime.js';

export class ParticleSystem {
  constructor({ maxParticles = 480, maxFloatingText = 96 } = {}) {
    Object.assign(this, createParticleSystemRuntimeState({
      maxParticles,
      maxFloatingText,
    }));
  }

  setQuality(qualityMultiplier = 1) {
    dispatchParticleSystemQuality(this, qualityMultiplier);
  }

  emitBurst({
    x,
    z,
    kind = 'dust',
    count = 6,
    color = 'rgba(191, 146, 87, 0.6)',
  }) {
    dispatchParticleSystemBurst(this, {
      x,
      z,
      kind,
      count,
      color,
    });
  }

  emitFloatingText({ x, z, text, color = '#f3ebd4' }) {
    dispatchParticleSystemFloatingText(this, {
      x,
      z,
      text,
      color,
    });
  }

  update(deltaSeconds) {
    dispatchParticleSystemUpdate(this, deltaSeconds);
  }

  buildRenderables(camera) {
    return buildParticleSystemRenderables(this, camera);
  }
}

