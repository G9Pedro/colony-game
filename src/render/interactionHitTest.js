export function pickBestInteractiveEntityHit(interactiveEntities, localX, localY) {
  let best = null;
  for (const item of interactiveEntities) {
    const dx = localX - item.centerX;
    const dy = localY - item.centerY;
    if (Math.abs(dx) > item.halfWidth || Math.abs(dy) > item.halfHeight) {
      continue;
    }
    const distance = Math.hypot(dx, dy);
    if (!best || item.depth > best.depth || (item.depth === best.depth && distance < best.distance)) {
      best = {
        entity: item.entity,
        depth: item.depth,
        distance,
      };
    }
  }
  return best;
}

