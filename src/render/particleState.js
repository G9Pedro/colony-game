import {
  resolveParticleDrag,
  resolveParticleLifetime,
  resolveParticleSize,
} from './particlePolicies.js';

export function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

export function pushCappedEntry(entries, entry, maxEntries) {
  if (entries.length >= maxEntries) {
    entries.shift();
  }
  entries.push(entry);
}

export function createBurstParticle({
  x,
  z,
  kind = 'dust',
  color = 'rgba(191, 146, 87, 0.6)',
  sampleBetween = randomBetween,
}) {
  return {
    x: x + sampleBetween(-0.3, 0.3),
    z: z + sampleBetween(-0.3, 0.3),
    y: sampleBetween(0, 0.14),
    vx: sampleBetween(-0.23, 0.23),
    vz: sampleBetween(-0.23, 0.23),
    vy: sampleBetween(0.4, 0.9),
    drag: resolveParticleDrag(kind),
    size: resolveParticleSize(kind, sampleBetween),
    age: 0,
    lifetime: resolveParticleLifetime(kind),
    color,
    kind,
  };
}

export function appendBurstParticles({
  particles,
  x,
  z,
  kind = 'dust',
  count = 6,
  color = 'rgba(191, 146, 87, 0.6)',
  maxParticles,
  sampleBetween = randomBetween,
}) {
  for (let idx = 0; idx < count; idx += 1) {
    pushCappedEntry(
      particles,
      createBurstParticle({
        x,
        z,
        kind,
        color,
        sampleBetween,
      }),
      maxParticles,
    );
  }
}

export function appendFloatingText({
  floatingText,
  maxFloatingText,
  x,
  z,
  text,
  color = '#f3ebd4',
}) {
  if (!text) {
    return;
  }
  pushCappedEntry(floatingText, {
    x,
    z,
    y: 0.3,
    age: 0,
    lifetime: 1.35,
    text,
    color,
  }, maxFloatingText);
}

export function updateParticles(entries, deltaSeconds) {
  return entries.filter((particle) => {
    particle.age += deltaSeconds;
    if (particle.age >= particle.lifetime) {
      return false;
    }
    particle.x += particle.vx * deltaSeconds;
    particle.z += particle.vz * deltaSeconds;
    particle.y += particle.vy * deltaSeconds;
    particle.vx *= Math.max(0, 1 - particle.drag * deltaSeconds);
    particle.vz *= Math.max(0, 1 - particle.drag * deltaSeconds);
    particle.vy *= Math.max(0, 1 - particle.drag * deltaSeconds * 1.5);
    return true;
  });
}

export function updateFloatingText(entries, deltaSeconds) {
  return entries.filter((item) => {
    item.age += deltaSeconds;
    if (item.age >= item.lifetime) {
      return false;
    }
    item.y += deltaSeconds * 0.38;
    return true;
  });
}
