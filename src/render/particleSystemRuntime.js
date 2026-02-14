export function createParticleSystemRuntimeState({
  maxParticles = 480,
  maxFloatingText = 96,
} = {}) {
  return {
    baseMaxParticles: maxParticles,
    baseMaxFloatingText: maxFloatingText,
    maxParticles,
    maxFloatingText,
    particles: [],
    floatingText: [],
  };
}
