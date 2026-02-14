function drawClinicDecoration({ ctx, cx, topY }) {
  ctx.strokeStyle = '#f0f4ff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 5, topY + 10);
  ctx.lineTo(cx + 5, topY + 10);
  ctx.moveTo(cx, topY + 5);
  ctx.lineTo(cx, topY + 15);
  ctx.stroke();
}

function drawSchoolDecoration({ ctx, cx, topY }) {
  ctx.fillStyle = 'rgba(255, 245, 220, 0.85)';
  ctx.fillRect(cx - 9, topY + 8, 5, 8);
  ctx.fillRect(cx - 1, topY + 8, 5, 8);
  ctx.fillRect(cx + 7, topY + 8, 5, 8);
}

function drawShrineDecoration({ ctx, cx, topY }) {
  ctx.fillStyle = '#e3d8a7';
  ctx.beginPath();
  ctx.moveTo(cx, topY - 14);
  ctx.lineTo(cx + 6, topY + 3);
  ctx.lineTo(cx - 6, topY + 3);
  ctx.closePath();
  ctx.fill();
}

function drawWatchtowerDecoration({ ctx, cx, topY }) {
  ctx.fillStyle = '#d6b24a';
  ctx.beginPath();
  ctx.moveTo(cx + 4, topY - 8);
  ctx.lineTo(cx + 4, topY - 24);
  ctx.lineTo(cx + 15, topY - 20);
  ctx.lineTo(cx + 4, topY - 16);
  ctx.closePath();
  ctx.fill();
}

function drawApartmentDecoration({ ctx, cx, topY }) {
  ctx.fillStyle = 'rgba(244, 238, 221, 0.72)';
  for (let row = 0; row < 3; row += 1) {
    for (let col = -2; col <= 2; col += 1) {
      ctx.fillRect(cx + col * 5, topY + 10 + row * 8, 3, 5);
    }
  }
}

export const CIVIC_BUILDING_DECORATION_HANDLERS = Object.freeze({
  apartment: drawApartmentDecoration,
  clinic: drawClinicDecoration,
  library: drawSchoolDecoration,
  school: drawSchoolDecoration,
  shrine: drawShrineDecoration,
  watchtower: drawWatchtowerDecoration,
});

