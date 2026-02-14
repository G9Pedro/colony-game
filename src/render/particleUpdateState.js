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
