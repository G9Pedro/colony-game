function drawFarmDecoration({ ctx, cx, baseY, footprintW, footprintH }) {
  ctx.strokeStyle = 'rgba(108, 84, 30, 0.55)';
  ctx.lineWidth = 1.2;
  for (let idx = -3; idx <= 3; idx += 1) {
    const offset = idx * (footprintW / 10);
    ctx.beginPath();
    ctx.moveTo(cx - footprintW * 0.38 + offset, baseY + footprintH * 0.35);
    ctx.lineTo(cx - footprintW * 0.2 + offset, baseY + footprintH * 0.48);
    ctx.stroke();
  }
}

function drawLumberCampDecoration({ ctx, cx, baseY, footprintW }) {
  ctx.fillStyle = '#7a4b2c';
  for (let idx = 0; idx < 4; idx += 1) {
    const x = cx + footprintW * 0.18 + idx * 5;
    const y = baseY + 8 + (idx % 2) * 3;
    ctx.beginPath();
    ctx.arc(x, y, 3.3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawQuarryDecoration({ ctx, cx, baseY }) {
  ctx.fillStyle = '#8d97a4';
  ctx.beginPath();
  ctx.moveTo(cx - 10, baseY + 8);
  ctx.lineTo(cx - 2, baseY + 2);
  ctx.lineTo(cx + 4, baseY + 8);
  ctx.lineTo(cx - 2, baseY + 13);
  ctx.closePath();
  ctx.fill();
}

function drawIronMineDecoration({ ctx, cx, baseY, footprintH }) {
  ctx.fillStyle = 'rgba(15, 16, 24, 0.65)';
  ctx.beginPath();
  ctx.ellipse(cx, baseY + footprintH * 0.22, 12, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#8b6d4c';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 11, baseY + footprintH * 0.22);
  ctx.lineTo(cx - 11, baseY + footprintH * 0.44);
  ctx.moveTo(cx + 11, baseY + footprintH * 0.22);
  ctx.lineTo(cx + 11, baseY + footprintH * 0.44);
  ctx.stroke();
}

function drawWorkshopDecoration({ ctx, cx, topY }) {
  ctx.fillStyle = '#5d6370';
  ctx.fillRect(cx + 10, topY - 20, 7, 20);
  ctx.fillStyle = 'rgba(230, 229, 231, 0.45)';
  ctx.fillRect(cx + 11, topY - 27, 5, 8);
}

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

function drawWarehouseDecoration({ ctx, cx, baseY }) {
  ctx.fillStyle = '#6f4a28';
  for (let idx = -2; idx <= 2; idx += 1) {
    ctx.fillRect(cx + idx * 5 - 2, baseY + 8 + Math.abs(idx), 5, 4);
  }
}

function drawApartmentDecoration({ ctx, cx, topY }) {
  ctx.fillStyle = 'rgba(244, 238, 221, 0.72)';
  for (let row = 0; row < 3; row += 1) {
    for (let col = -2; col <= 2; col += 1) {
      ctx.fillRect(cx + col * 5, topY + 10 + row * 8, 3, 5);
    }
  }
}

const handlers = {
  apartment: drawApartmentDecoration,
  clinic: drawClinicDecoration,
  farm: drawFarmDecoration,
  ironMine: drawIronMineDecoration,
  library: drawSchoolDecoration,
  lumberCamp: drawLumberCampDecoration,
  quarry: drawQuarryDecoration,
  school: drawSchoolDecoration,
  shrine: drawShrineDecoration,
  warehouse: drawWarehouseDecoration,
  watchtower: drawWatchtowerDecoration,
  workshop: drawWorkshopDecoration,
};

export const BUILDING_DECORATION_HANDLERS = Object.freeze(handlers);

export function getBuildingDecorationHandler(type) {
  return BUILDING_DECORATION_HANDLERS[type] ?? null;
}

