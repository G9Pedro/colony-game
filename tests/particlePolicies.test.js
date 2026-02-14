import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clampParticleValue,
  resolveFloatingTextFontSize,
  resolveParticleDrag,
  resolveParticleLifetime,
  resolveParticleQualityBudgets,
  resolveParticleSize,
} from '../src/render/particlePolicies.js';

test('clampParticleValue constrains values to provided range', () => {
  assert.equal(clampParticleValue(-5, 0, 1), 0);
  assert.equal(clampParticleValue(0.5, 0, 1), 0.5);
  assert.equal(clampParticleValue(7, 0, 1), 1);
});

test('resolveParticleQualityBudgets applies clamped multiplier and minimum floors', () => {
  assert.deepEqual(resolveParticleQualityBudgets({
    baseMaxParticles: 480,
    baseMaxFloatingText: 96,
    qualityMultiplier: 0.2,
  }), {
    maxParticles: 168,
    maxFloatingText: 33,
  });
  assert.deepEqual(resolveParticleQualityBudgets({
    baseMaxParticles: 80,
    baseMaxFloatingText: 12,
    qualityMultiplier: 0.5,
  }), {
    maxParticles: 120,
    maxFloatingText: 24,
  });
});

test('particle policy helpers map lifetime/drag/size by particle type', () => {
  assert.equal(resolveParticleLifetime('smoke'), 1.7);
  assert.equal(resolveParticleLifetime('sparkle'), 1);
  assert.equal(resolveParticleLifetime('dust'), 0.75);

  assert.equal(resolveParticleDrag('smoke'), 0.3);
  assert.equal(resolveParticleDrag('sparkle'), 0.5);

  const sampleCalls = [];
  const size = resolveParticleSize('sparkle', (min, max) => {
    sampleCalls.push([min, max]);
    return 1.8;
  });
  assert.equal(size, 1.8);
  assert.deepEqual(sampleCalls, [[1.2, 2.5]]);
});

test('resolveFloatingTextFontSize enforces minimum size while scaling with zoom', () => {
  assert.equal(resolveFloatingTextFontSize(0.3), 10);
  assert.equal(resolveFloatingTextFontSize(1.25), 17);
});
