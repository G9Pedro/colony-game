import { resolveParticleQualityBudgets } from './particlePolicies.js';
import { buildParticleRenderables } from './particleRenderables.js';
import {
  appendBurstParticles,
  appendFloatingText,
  updateFloatingText,
  updateParticles,
} from './particleState.js';

export function dispatchParticleSystemQuality(
  system,
  qualityMultiplier = 1,
  deps = {},
) {
  const resolveBudgets = deps.resolveBudgets ?? resolveParticleQualityBudgets;
  const budgets = resolveBudgets({
    baseMaxParticles: system.baseMaxParticles,
    baseMaxFloatingText: system.baseMaxFloatingText,
    qualityMultiplier,
  });
  system.maxParticles = budgets.maxParticles;
  system.maxFloatingText = budgets.maxFloatingText;
  if (system.particles.length > system.maxParticles) {
    system.particles.splice(0, system.particles.length - system.maxParticles);
  }
  if (system.floatingText.length > system.maxFloatingText) {
    system.floatingText.splice(0, system.floatingText.length - system.maxFloatingText);
  }
}

export function dispatchParticleSystemBurst(system, payload, deps = {}) {
  const appendBurst = deps.appendBurst ?? appendBurstParticles;
  appendBurst({
    particles: system.particles,
    ...payload,
    maxParticles: system.maxParticles,
  });
}

export function dispatchParticleSystemFloatingText(system, payload, deps = {}) {
  const appendText = deps.appendText ?? appendFloatingText;
  appendText({
    floatingText: system.floatingText,
    maxFloatingText: system.maxFloatingText,
    ...payload,
  });
}

export function dispatchParticleSystemUpdate(system, deltaSeconds, deps = {}) {
  if (deltaSeconds <= 0) {
    return;
  }
  const updateParticleEntries = deps.updateParticleEntries ?? updateParticles;
  const updateTextEntries = deps.updateTextEntries ?? updateFloatingText;
  system.particles = updateParticleEntries(system.particles, deltaSeconds);
  system.floatingText = updateTextEntries(system.floatingText, deltaSeconds);
}

export function buildParticleSystemRenderables(system, camera, deps = {}) {
  const buildRenderables = deps.buildRenderables ?? buildParticleRenderables;
  return buildRenderables({
    particles: system.particles,
    floatingText: system.floatingText,
    camera,
  });
}
