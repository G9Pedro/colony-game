import { collectBuildingEffectBursts } from './buildingEffects.js';
import { diffNewBuildingPlacements } from './buildingPlacementTracker.js';

const BUILDING_PLACEMENT_DUST_COLOR = 'rgba(193, 153, 104, 0.72)';

export function syncPlacementAnimationEffects({
  buildings,
  knownBuildingIds,
  now,
  animations,
  effectsEnabled,
  particles,
  diffPlacements = diffNewBuildingPlacements,
  placementDurationMs = 320,
  placementDustCount = 10,
  placementDustColor = BUILDING_PLACEMENT_DUST_COLOR,
}) {
  const { nextIds, newBuildings } = diffPlacements(buildings, knownBuildingIds);
  newBuildings.forEach((building) => {
    animations.registerPlacement(building.id, now, placementDurationMs);
    if (!effectsEnabled) {
      return;
    }
    particles.emitBurst({
      x: building.x,
      z: building.z,
      kind: 'dust',
      count: placementDustCount,
      color: placementDustColor,
    });
  });
  return nextIds;
}

export function maybeEmitResourceGainFloatingText({
  gains,
  state,
  effectsEnabled,
  shouldRunOptionalEffects,
  particles,
  camera,
  random = Math.random,
  textColor = '#f4ead0',
}) {
  if (gains.length === 0 || !effectsEnabled || !shouldRunOptionalEffects) {
    return false;
  }

  const { resource, delta } = gains[0];
  const origin = state.buildings[Math.floor(random() * Math.max(1, state.buildings.length))];
  particles.emitFloatingText({
    x: origin?.x ?? camera.centerX,
    z: origin?.z ?? camera.centerZ,
    text: `+${Math.floor(delta)} ${resource}`,
    color: textColor,
  });
  return true;
}

export function emitAmbientBuildingEffects({
  state,
  deltaSeconds,
  effectsEnabled,
  shouldRunOptionalEffects,
  qualityMultiplier,
  particles,
  collectBursts = collectBuildingEffectBursts,
}) {
  if (!effectsEnabled || !shouldRunOptionalEffects) {
    return 0;
  }

  const bursts = collectBursts(state.buildings, {
    deltaSeconds,
    qualityMultiplier,
  });
  bursts.forEach((burst) => particles.emitBurst(burst));
  return bursts.length;
}

