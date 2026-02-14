import { JOB_COLORS } from './spriteFactoryConstants.js';
import { shadeColor } from './spriteMath.js';

export function resolveColonistAnimationOffsets(frame = 0, idle = false) {
  const legSwing = idle ? 0 : (frame % 3 === 1 ? -1.5 : frame % 3 === 2 ? 1.5 : 0);
  const bodyLift = idle ? Math.sin(frame * 0.8) * 0.6 : 0;
  return { legSwing, bodyLift };
}

export function drawColonistSprite(ctx, {
  job = 'laborer',
  frame = 0,
  idle = false,
  jobColors = JOB_COLORS,
  shade = shadeColor,
} = {}) {
  const color = jobColors[job] ?? jobColors.laborer;
  const x = 12;
  const y = 18;
  const { legSwing, bodyLift } = resolveColonistAnimationOffsets(frame, idle);

  ctx.fillStyle = 'rgba(20, 18, 14, 0.22)';
  ctx.beginPath();
  ctx.ellipse(x, y + 9.5, 5.5, 2.8, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = shade(color, 0.7);
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(x - 2, y + 4);
  ctx.lineTo(x - 3.5 + legSwing, y + 10.5);
  ctx.moveTo(x + 2, y + 4);
  ctx.lineTo(x + 3.5 - legSwing, y + 10.5);
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x - 3.8, y - 3.5 + bodyLift, 7.6, 9.3, 3.3);
  ctx.fill();

  ctx.fillStyle = '#f1cfb3';
  ctx.beginPath();
  ctx.arc(x, y - 6 + bodyLift, 3.3, 0, Math.PI * 2);
  ctx.fill();
}

