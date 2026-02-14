function formatFps(fps) {
  if (!Number.isFinite(fps)) {
    return 0;
  }
  return Math.max(0, Math.round(fps));
}

function formatQuality(quality) {
  if (!Number.isFinite(quality)) {
    return '—';
  }
  const clamped = Math.max(0, Math.min(1, quality));
  return `${Math.round(clamped * 100)}%`;
}

export function formatRenderStatsLabel(renderStats) {
  if (!renderStats) {
    return 'FPS —';
  }
  const mode = renderStats.mode === 'three' ? 'three' : 'isometric';
  return `${mode} · ${formatFps(renderStats.fps)}fps · q${formatQuality(renderStats.quality)}`;
}

