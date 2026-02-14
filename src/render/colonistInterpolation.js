function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function getColonistInterpolationFactor(deltaSeconds) {
  return clamp(deltaSeconds * 8, 0.12, 1);
}

export function updateColonistRenderState(colonists, renderStateMap, deltaSeconds) {
  const aliveIds = new Set();
  const interpolation = getColonistInterpolationFactor(deltaSeconds);

  for (const colonist of colonists) {
    if (!colonist.alive) {
      continue;
    }
    aliveIds.add(colonist.id);
    let renderState = renderStateMap.get(colonist.id);
    if (!renderState) {
      renderState = {
        x: colonist.position.x,
        z: colonist.position.z,
      };
      renderStateMap.set(colonist.id, renderState);
    }
    renderState.x += (colonist.position.x - renderState.x) * interpolation;
    renderState.z += (colonist.position.z - renderState.z) * interpolation;
  }

  for (const [id] of renderStateMap.entries()) {
    if (!aliveIds.has(id)) {
      renderStateMap.delete(id);
    }
  }
}

