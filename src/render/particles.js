import { resolveParticleQualityBudgets } from './particlePolicies.js';
import { buildParticleRenderables } from './particleRenderables.js';
import {
  appendBurstParticles,
  appendFloatingText,
  updateFloatingText,
  updateParticles,
} from './particleState.js';

export class ParticleSystem {
  constructor({ maxParticles = 480, maxFloatingText = 96 } = {}) {
    this.baseMaxParticles = maxParticles;
    this.baseMaxFloatingText = maxFloatingText;
    this.maxParticles = maxParticles;
    this.maxFloatingText = maxFloatingText;
    this.particles = [];
    this.floatingText = [];
  }

  setQuality(qualityMultiplier = 1) {
    const budgets = resolveParticleQualityBudgets({
      baseMaxParticles: this.baseMaxParticles,
      baseMaxFloatingText: this.baseMaxFloatingText,
      qualityMultiplier,
    });
    this.maxParticles = budgets.maxParticles;
    this.maxFloatingText = budgets.maxFloatingText;
    if (this.particles.length > this.maxParticles) {
      this.particles.splice(0, this.particles.length - this.maxParticles);
    }
    if (this.floatingText.length > this.maxFloatingText) {
      this.floatingText.splice(0, this.floatingText.length - this.maxFloatingText);
    }
  }

  emitBurst({
    x,
    z,
    kind = 'dust',
    count = 6,
    color = 'rgba(191, 146, 87, 0.6)',
  }) {
    appendBurstParticles({
      particles: this.particles,
      x,
      z,
      kind,
      count,
      color,
      maxParticles: this.maxParticles,
    });
  }

  emitFloatingText({ x, z, text, color = '#f3ebd4' }) {
    appendFloatingText({
      floatingText: this.floatingText,
      maxFloatingText: this.maxFloatingText,
      x,
      z,
      text,
      color,
    });
  }

  update(deltaSeconds) {
    if (deltaSeconds <= 0) {
      return;
    }
    this.particles = updateParticles(this.particles, deltaSeconds);
    this.floatingText = updateFloatingText(this.floatingText, deltaSeconds);
  }

  buildRenderables(camera) {
    return buildParticleRenderables({
      particles: this.particles,
      floatingText: this.floatingText,
      camera,
    });
  }
}

