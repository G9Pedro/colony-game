import test from 'node:test';
import assert from 'node:assert/strict';
import { collectBuildingEffectBursts, computeBuildingEffectSmokeRate } from '../src/render/buildingEffects.js';

test('computeBuildingEffectSmokeRate scales by delta and quality', () => {
  const high = computeBuildingEffectSmokeRate(0.2, 1);
  const low = computeBuildingEffectSmokeRate(0.1, 0.5);
  assert.ok(Math.abs(high - 0.15) < 0.0000001);
  assert.ok(Math.abs(low - 0.0375) < 0.0000001);
});

test('collectBuildingEffectBursts emits expected bursts with deterministic random values', () => {
  const sequence = [0.05, 0.9, 0.9, 0.01, 0.01, 0.01];
  let index = 0;
  const randomValue = () => {
    const next = sequence[index] ?? 1;
    index += 1;
    return next;
  };

  const bursts = collectBuildingEffectBursts([
    { type: 'workshop', x: 1, z: 2 },
    { type: 'library', x: -3, z: 5 },
    { type: 'farm', x: 8, z: 9 },
  ], {
    deltaSeconds: 0.2,
    qualityMultiplier: 1,
    randomValue,
  });

  assert.deepEqual(bursts, [
    {
      x: 1.3,
      z: 1.8,
      kind: 'smoke',
      count: 2,
      color: 'rgba(185, 188, 196, 0.45)',
    },
    {
      x: -3,
      z: 5,
      kind: 'sparkle',
      count: 1,
      color: 'rgba(253, 235, 177, 0.65)',
    },
  ]);
});

