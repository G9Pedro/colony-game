import { hash2d } from './spriteMath.js';

export function drawTextureNoise(ctx, width, height, strength = 0.05, seed = 1) {
  const sampleCount = Math.floor(width * height * strength * 0.02);
  ctx.fillStyle = 'rgba(34, 20, 10, 0.18)';
  for (let idx = 0; idx < sampleCount; idx += 1) {
    const random = hash2d(seed + idx * 0.17, idx * 0.23, seed);
    const x = Math.floor(random * width);
    const y = Math.floor(hash2d(seed + idx * 0.29, idx * 0.11, 9) * height);
    ctx.fillRect(x, y, 1, 1);
  }
}

export function drawScaffoldOverlay(ctx, canvasWidth, canvasHeight) {
  ctx.save();
  ctx.strokeStyle = 'rgba(203, 163, 84, 0.65)';
  ctx.lineWidth = 2;
  for (let x = 18; x < canvasWidth - 18; x += 16) {
    ctx.beginPath();
    ctx.moveTo(x, canvasHeight - 18);
    ctx.lineTo(x, 24);
    ctx.stroke();
  }
  for (let y = canvasHeight - 20; y > 20; y -= 14) {
    ctx.beginPath();
    ctx.moveTo(14, y);
    ctx.lineTo(canvasWidth - 14, y);
    ctx.stroke();
  }
  ctx.restore();
}

