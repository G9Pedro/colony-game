export function resolveLegacyPointerUpOutcome({
  dragEnd,
  pickEntity,
  pickGround,
  roundGroundPoint,
}) {
  if (!dragEnd?.active || dragEnd.moved) {
    return { type: 'none' };
  }

  const selectedEntity = pickEntity(dragEnd.clientX, dragEnd.clientY);
  if (selectedEntity) {
    return {
      type: 'select-entity',
      entity: selectedEntity,
    };
  }

  const point = pickGround(dragEnd.clientX, dragEnd.clientY);
  const roundedPoint = roundGroundPoint(point);
  if (!roundedPoint) {
    return { type: 'none' };
  }

  return {
    type: 'ground-click',
    point: roundedPoint,
  };
}

