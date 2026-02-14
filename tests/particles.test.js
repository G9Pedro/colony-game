import test from 'node:test';
import assert from 'node:assert/strict';
import { ParticleSystem } from '../src/render/particles.js';

test('ParticleSystem setQuality clamps budgets and trims existing arrays', () => {
  const system = new ParticleSystem({
    maxParticles: 200,
    maxFloatingText: 40,
  });
  system.particles = Array.from({ length: 200 }, (_, id) => ({ id }));
  system.floatingText = Array.from({ length: 40 }, (_, id) => ({ id }));

  system.setQuality(0.4);
  assert.equal(system.maxParticles, 120);
  assert.equal(system.maxFloatingText, 24);
  assert.equal(system.particles.length, 120);
  assert.equal(system.floatingText.length, 24);
});

test('ParticleSystem emit/update/render pipeline produces drawables', () => {
  const system = new ParticleSystem({
    maxParticles: 4,
    maxFloatingText: 2,
  });
  const originalRandom = Math.random;
  Math.random = () => 0.5;
  try {
    system.emitBurst({
      x: 1,
      z: 2,
      kind: 'sparkle',
      count: 3,
      color: '#ff0',
    });
    system.emitFloatingText({
      x: 1,
      z: 2,
      text: '+2 stone',
    });
  } finally {
    Math.random = originalRandom;
  }

  assert.equal(system.particles.length, 3);
  assert.equal(system.floatingText.length, 1);
  system.update(0.1);
  const renderables = system.buildRenderables({
    zoom: 1,
    worldToScreen: (x, z) => ({ x: x * 10, y: z * 10 }),
  });
  assert.equal(renderables.length, 4);
  assert.ok(renderables.every((entry) => typeof entry.draw === 'function'));
});
