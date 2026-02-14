import {
  createIndustrialSmokeBurst,
  createMysticSparkleBurst,
  shouldEmitIndustrialSmoke,
  shouldEmitMysticSparkle,
} from './effectPolicies.js';

const BASE_SMOKE_RATE = 0.75;

export function computeBuildingEffectSmokeRate(deltaSeconds, qualityMultiplier) {
  return deltaSeconds * BASE_SMOKE_RATE * qualityMultiplier;
}

export function collectBuildingEffectBursts(buildings, {
  deltaSeconds,
  qualityMultiplier,
  randomValue = () => Math.random(),
} = {}) {
  const smokeRate = computeBuildingEffectSmokeRate(deltaSeconds, qualityMultiplier);
  const bursts = [];

  for (const building of buildings) {
    if (shouldEmitIndustrialSmoke(building.type, randomValue(), smokeRate)) {
      bursts.push(createIndustrialSmokeBurst(building, qualityMultiplier));
    }
    if (shouldEmitMysticSparkle(building.type, randomValue(), smokeRate)) {
      bursts.push(createMysticSparkleBurst(building));
    }
  }

  return bursts;
}

