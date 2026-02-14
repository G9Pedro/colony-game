import test from 'node:test';
import assert from 'node:assert/strict';
import {
  appendBurstParticles,
  appendFloatingText,
  createBurstParticle,
  pushCappedEntry,
  updateFloatingText,
  updateParticles,
} from '../src/render/particleState.js';

test('pushCappedEntry evicts oldest entry when at capacity', () => {
  const entries = [{ id: 1 }, { id: 2 }];
  pushCappedEntry(entries, { id: 3 }, 2);
  assert.deepEqual(entries, [{ id: 2 }, { id: 3 }]);
});

test('createBurstParticle derives deterministic particle fields from sampler', () => {
  const sampleValues = [0.1, -0.2, 0.04, 0.05, -0.06, 0.7, 1.9];
  const particle = createBurstParticle({
    x: 3,
    z: -4,
    kind: 'sparkle',
    color: '#fff',
    sampleBetween: () => sampleValues.shift(),
  });

  assert.deepEqual(particle, {
    x: 3.1,
    z: -4.2,
    y: 0.04,
    vx: 0.05,
    vz: -0.06,
    vy: 0.7,
    drag: 0.5,
    size: 1.9,
    age: 0,
    lifetime: 1,
    color: '#fff',
    kind: 'sparkle',
  });
});

test('appendBurstParticles appends bounded burst entries', () => {
  const particles = [
    { id: 'old-a' },
    { id: 'old-b' },
  ];
  let serial = 0;
  appendBurstParticles({
    particles,
    x: 0,
    z: 0,
    count: 3,
    maxParticles: 3,
    sampleBetween: () => serial++ * 0.01,
  });
  assert.equal(particles.length, 3);
  assert.equal(particles[0].id, undefined);
  assert.equal(particles[2].kind, 'dust');
});

test('appendFloatingText ignores empty labels and maintains cap', () => {
  const floatingText = [
    { text: 'a' },
    { text: 'b' },
  ];
  appendFloatingText({
    floatingText,
    maxFloatingText: 2,
    x: 0,
    z: 0,
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

test('updateParticles advances position/velocity and prunes expired entries', () => {
  const particles = [
    {
      x: 1,
      z: 2,
      y: 0,
      vx: 4,
      vz: -2,
      vy: 1,
      drag: 0.5,
      age: 0,
      lifetime: 2,
    },
    {
      x: 0,
      z: 0,
      y: 0,
      vx: 0,
      vz: 0,
      vy: 0,
      drag: 0.5,
      age: 0.9,
      lifetime: 1,
    },
  ];
  const next = updateParticles(particles, 0.2);
  assert.equal(next.length, 1);
  assert.deepEqual(next[0], {
    x: 1.8,
    z: 1.6,
    y: 0.2,
    vx: 3.6,
    vz: -1.8,
    vy: 0.85,
    drag: 0.5,
    age: 0.2,
    lifetime: 2,
  });
});

test('updateFloatingText increments lift and removes expired entries', () => {
  const next = updateFloatingText([
    { y: 1, age: 0.2, lifetime: 0.5, text: 'alive' },
    { y: 2, age: 0.45, lifetime: 0.5, text: 'expired' },
  ], 0.1);
  assert.deepEqual(next, [
    { y: 1.038, age: 0.30000000000000004, lifetime: 0.5, text: 'alive' },
  ]);
});
