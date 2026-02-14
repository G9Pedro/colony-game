import test from 'node:test';
import assert from 'node:assert/strict';
import { createParticleSystemRuntimeState } from '../src/render/particleSystemRuntime.js';

test('createParticleSystemRuntimeState builds defaults and initializes arrays', () => {
  const runtime = createParticleSystemRuntimeState();
  assert.equal(runtime.baseMaxParticles, 480);
  assert.equal(runtime.baseMaxFloatingText, 96);
  assert.equal(runtime.maxParticles, 480);
  assert.equal(runtime.maxFloatingText, 96);
  assert.deepEqual(runtime.particles, []);
  assert.deepEqual(runtime.floatingText, []);
});

test('createParticleSystemRuntimeState applies custom capacities', () => {
  const runtime = createParticleSystemRuntimeState({
    maxParticles: 250,
    maxFloatingText: 50,
  });
  assert.equal(runtime.baseMaxParticles, 250);
  assert.equal(runtime.baseMaxFloatingText, 50);
  assert.equal(runtime.maxParticles, 250);
  assert.equal(runtime.maxFloatingText, 50);
});
