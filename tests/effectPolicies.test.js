import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createIndustrialSmokeBurst,
  createMysticSparkleBurst,
  shouldEmitIndustrialSmoke,
  shouldEmitMysticSparkle,
} from '../src/render/effectPolicies.js';

test('effect policy predicates respect building type and thresholds', () => {
  assert.equal(shouldEmitIndustrialSmoke('workshop', 0.1, 0.2), true);
  assert.equal(shouldEmitIndustrialSmoke('farm', 0.1, 0.2), false);
  assert.equal(shouldEmitMysticSparkle('library', 0.05, 0.2), true);
  assert.equal(shouldEmitMysticSparkle('library', 0.2, 0.2), false);
});

test('effect burst payload factories emit stable schemas', () => {
  assert.deepEqual(createIndustrialSmokeBurst({ x: 8, z: -3 }, 0.5), {
    x: 8.3,
    z: -3.2,
    kind: 'smoke',
    count: 1,
    color: 'rgba(185, 188, 196, 0.45)',
  });
  assert.deepEqual(createMysticSparkleBurst({ x: -2, z: 4 }), {
    x: -2,
    z: 4,
    kind: 'sparkle',
    count: 1,
    color: 'rgba(253, 235, 177, 0.65)',
  });
});

