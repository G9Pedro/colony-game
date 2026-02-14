export function drawDiamond(ctx, cx, cy, width, height, fillStyle, strokeStyle = null) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - height * 0.5);
  ctx.lineTo(cx + width * 0.5, cy);
  ctx.lineTo(cx, cy + height * 0.5);
  ctx.lineTo(cx - width * 0.5, cy);
  ctx.closePath();
  ctx.fillStyle = fillStyle;
  ctx.fill();
  if (strokeStyle) {
    ctx.strokeStyle = strokeStyle;
    ctx.stroke();
  }
}

export function drawIsoPrism(ctx, {
  cx,
  baseY,
  width,
  depth,
  height,
  topColor,
  leftColor,
  rightColor,
  strokeColor = 'rgba(20, 12, 7, 0.25)',
}) {
  const topY = baseY - height;
  const n = { x: cx, y: topY - depth * 0.5 };
  const e = { x: cx + width * 0.5, y: topY };
  const s = { x: cx, y: topY + depth * 0.5 };
  const w = { x: cx - width * 0.5, y: topY };

  const be = { x: cx + width * 0.5, y: baseY };
  const bs = { x: cx, y: baseY + depth * 0.5 };
  const bw = { x: cx - width * 0.5, y: baseY };

  ctx.beginPath();
  ctx.moveTo(w.x, w.y);
  ctx.lineTo(s.x, s.y);
  ctx.lineTo(bs.x, bs.y);
  ctx.lineTo(bw.x, bw.y);
  ctx.closePath();
  ctx.fillStyle = leftColor;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(e.x, e.y);
  ctx.lineTo(s.x, s.y);
  ctx.lineTo(bs.x, bs.y);
  ctx.lineTo(be.x, be.y);
  ctx.closePath();
  ctx.fillStyle = rightColor;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(n.x, n.y);
  ctx.lineTo(e.x, e.y);
  ctx.lineTo(s.x, s.y);
  ctx.lineTo(w.x, w.y);
  ctx.closePath();
  ctx.fillStyle = topColor;
  ctx.fill();

  ctx.strokeStyle = strokeColor;
  ctx.stroke();
  return {
    topCenterY: topY,
    topSouthY: s.y,
  };
}

