import test from 'node:test';
import assert from 'node:assert/strict';
import {
  appendBurstParticles,
  appendFloatingText,
  createBurstParticle,
  pushCappedEntry,
} from '../src/render/particleEmissionState.js';

test('particle emission helpers create deterministic bursts and capped entries', () => {
  const entries = [{ id: 1 }, { id: 2 }];
  pushCappedEntry(entries, { id: 3 }, 2);
  assert.deepEqual(entries, [{ id: 2 }, { id: 3 }]);

  const sampleValues = [0.1, -0.2, 0.04, 0.05, -0.06, 0.7, 1.9];
  const particle = createBurstParticle({
    x: 3,
    z: -4,
    kind: 'sparkle',
    color: '#fff',
    sampleBetween: () => sampleValues.shift(),
  });
  assert.equal(particle.kind, 'sparkle');
  assert.equal(particle.drag, 0.5);
  assert.equal(particle.lifetime, 1);

  const particles = [{ id: 'old' }];
  appendBurstParticles({
    particles,
    x: 0,
    z: 0,
    count: 2,
    maxParticles: 2,
    sampleBetween: () => 0,
  });
  assert.equal(particles.length, 2);
  assert.equal(particles[0].id, undefined);
});

test('appendFloatingText skips empty labels and caps list length', () => {
  const floatingText = [{ text: 'a' }, { text: 'b' }];
  appendFloatingText({
    floatingText,
    maxFloatingText: 2,
    x: 1,
    z: 2,
    text: '',
  });
  assert.deepEqual(floatingText, [{ text: 'a' }, { text: 'b' }]);

  appendFloatingText({
    floatingText,
    maxFloatingText: 2,
    x: 5,
    z: 7,
    text: '+4 wood',
    color: '#abc',
  });
  assert.deepEqual(floatingText, [
    { text: 'b' },
    {
      x: 5,
      z: 7,
      y: 0.3,
      age: 0,
      lifetime: 1.35,
      text: '+4 wood',
      color: '#abc',
    },
  ]);
});
