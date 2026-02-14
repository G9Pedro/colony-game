import { toRoundedGroundPoint } from './legacyInteractionPrimitives.js';
import { resolveLegacyPointerUpOutcome } from './legacyInteractionOutcomes.js';
import { endLegacyPointerDrag } from './legacyPointerState.js';

export function handleLegacyPointerUpEvent({
  event,
  dragState,
  onEntitySelect,
  onGroundClick,
  screenToEntity,
  screenToGround,
  endPointerDrag = endLegacyPointerDrag,
  resolvePointerUpOutcome = resolveLegacyPointerUpOutcome,
  roundGroundPoint = toRoundedGroundPoint,
}) {
  const dragEnd = endPointerDrag(dragState);
  const outcome = resolvePointerUpOutcome({
    dragEnd,
    pickEntity: (clientX, clientY) => screenToEntity(clientX, clientY),
    pickGround: (clientX, clientY) => screenToGround(clientX, clientY),
    roundGroundPoint,
  });
  if (outcome.type === 'select-entity') {
    onEntitySelect?.(outcome.entity);
  } else if (outcome.type === 'ground-click') {
    onGroundClick?.(outcome.point);
  }
  return outcome;
}

