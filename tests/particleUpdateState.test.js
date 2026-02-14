import test from 'node:test';
import assert from 'node:assert/strict';
import { updateFloatingText, updateParticles } from '../src/render/particleUpdateState.js';

test('updateParticles advances position/velocity and removes expired items', () => {
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

test('updateFloatingText increments lift and drops expired entries', () => {
  const next = updateFloatingText([
    { y: 1, age: 0.2, lifetime: 0.5, text: 'alive' },
    { y: 2, age: 0.45, lifetime: 0.5, text: 'expired' },
  ], 0.1);
  assert.deepEqual(next, [
    { y: 1.038, age: 0.30000000000000004, lifetime: 0.5, text: 'alive' },
  ]);
});
