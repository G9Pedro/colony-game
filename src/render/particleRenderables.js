import {
  clampParticleValue,
  resolveFloatingTextFontSize,
} from './particlePolicies.js';

export function buildParticleRenderables({
  particles,
  floatingText,
  camera,
}) {
  const renderables = [];

  particles.forEach((particle) => {
    const alpha = clampParticleValue(1 - particle.age / particle.lifetime, 0, 1);
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

  floatingText.forEach((item) => {
    const alpha = clampParticleValue(1 - item.age / item.lifetime, 0, 1);
    const screen = camera.worldToScreen(item.x, item.z);
    renderables.push({
      depth: item.x + item.z + 0.8,
      draw: (ctx) => {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = item.color;
        ctx.font = `${resolveFloatingTextFontSize(camera.zoom)}px "Trebuchet MS", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(item.text, screen.x, screen.y - item.y * 26 * camera.zoom);
        ctx.restore();
      },
    });
  });

  return renderables;
}
