import { resolveClickSelectionOutcome } from './clickSelection.js';
import { pickBestInteractiveEntityHit } from './interactionHitTest.js';

export function updateIsometricHoverSelection({
  interactiveEntities,
  localX,
  localY,
  setHoveredEntity,
  pickHit = pickBestInteractiveEntityHit,
}) {
  const hit = pickHit(interactiveEntities, localX, localY);
  const hoveredEntity = hit?.entity ?? null;
  setHoveredEntity(hoveredEntity);
  return hoveredEntity;
}

export function handleIsometricClickSelection({
  interactiveEntities,
  localX,
  localY,
  tile,
  selectedBuildingType,
  setSelectedEntity,
  onGroundClick,
  pickHit = pickBestInteractiveEntityHit,
  resolveClickOutcome = resolveClickSelectionOutcome,
}) {
  const hit = pickHit(interactiveEntities, localX, localY);
  const outcome = resolveClickOutcome({
    selectedBuildingType,
    hitEntity: hit?.entity ?? null,
  });
  if (outcome.selectionAction === 'set') {
    setSelectedEntity(outcome.selectedEntity);
  } else if (outcome.selectionAction === 'clear') {
    setSelectedEntity(null);
  }
  if (outcome.shouldGroundClick && onGroundClick) {
    onGroundClick({ x: tile.x, z: tile.z });
  }
  return outcome;
}

