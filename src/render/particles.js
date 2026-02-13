function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

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
    const clamped = clamp(qualityMultiplier, 0.35, 1);
    this.maxParticles = Math.max(120, Math.floor(this.baseMaxParticles * clamped));
    this.maxFloatingText = Math.max(24, Math.floor(this.baseMaxFloatingText * clamped));
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
    const lifetime = kind === 'smoke' ? 1.7 : kind === 'sparkle' ? 1 : 0.75;
    for (let idx = 0; idx < count; idx += 1) {
      if (this.particles.length >= this.maxParticles) {
        this.particles.shift();
      }
      this.particles.push({
        x: x + randomBetween(-0.3, 0.3),
        z: z + randomBetween(-0.3, 0.3),
        y: randomBetween(0, 0.14),
        vx: randomBetween(-0.23, 0.23),
        vz: randomBetween(-0.23, 0.23),
        vy: randomBetween(0.4, 0.9),
        drag: kind === 'smoke' ? 0.3 : 0.5,
        size: kind === 'sparkle' ? randomBetween(1.2, 2.5) : randomBetween(2, 4),
        age: 0,
        lifetime,
        color,
        kind,
      });
    }
  }

  emitFloatingText({ x, z, text, color = '#f3ebd4' }) {
    if (!text) {
      return;
    }
    if (this.floatingText.length >= this.maxFloatingText) {
      this.floatingText.shift();
    }
    this.floatingText.push({
      x,
      z,
      y: 0.3,
      age: 0,
      lifetime: 1.35,
      text,
      color,
    });
  }

  update(deltaSeconds) {
    if (deltaSeconds <= 0) {
      return;
    }
    this.particles = this.particles.filter((particle) => {
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

    this.floatingText = this.floatingText.filter((item) => {
      item.age += deltaSeconds;
      if (item.age >= item.lifetime) {
        return false;
      }
      item.y += deltaSeconds * 0.38;
      return true;
    });
  }

  buildRenderables(camera) {
    const renderables = [];

    this.particles.forEach((particle) => {
      const alpha = clamp(1 - particle.age / particle.lifetime, 0, 1);
      const screen = camera.worldToScreen(particle.x, particle.z);
      renderables.push({
        depth: particle.x + particle.z + 0.4,
        draw: (ctx) => {
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.fillStyle = particle.color;
          const lift = particle.y * 14 * camera.zoom;
          const radius = particle.size * camera.zoom;
          ctx.beginPath();
          ctx.arc(screen.x, screen.y - lift, radius, 0, Math.PI * 2);
          ctx.fill();
          if (particle.kind === 'sparkle') {
            ctx.strokeStyle = 'rgba(255, 249, 214, 0.72)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(screen.x - radius - 1, screen.y - lift);
            ctx.lineTo(screen.x + radius + 1, screen.y - lift);
            ctx.moveTo(screen.x, screen.y - lift - radius - 1);
            ctx.lineTo(screen.x, screen.y - lift + radius + 1);
            ctx.stroke();
          }
          ctx.restore();
        },
      });
    });

    this.floatingText.forEach((item) => {
      const alpha = clamp(1 - item.age / item.lifetime, 0, 1);
      const screen = camera.worldToScreen(item.x, item.z);
      renderables.push({
        depth: item.x + item.z + 0.8,
        draw: (ctx) => {
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.fillStyle = item.color;
          ctx.font = `${Math.max(10, Math.floor(14 * camera.zoom))}px "Trebuchet MS", sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillText(item.text, screen.x, screen.y - item.y * 26 * camera.zoom);
          ctx.restore();
        },
      });
    });

    return renderables;
  }
}

