import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildParticleSystemRenderables,
  dispatchParticleSystemBurst,
  dispatchParticleSystemFloatingText,
  dispatchParticleSystemQuality,
  dispatchParticleSystemUpdate,
} from '../src/render/particleSystemDispatch.js';

function createSystem(overrides = {}) {
  return {
    baseMaxParticles: 10,
    baseMaxFloatingText: 5,
    maxParticles: 10,
    maxFloatingText: 5,
    particles: [],
    floatingText: [],
    ...overrides,
  };
}

test('dispatchParticleSystemQuality updates budgets and trims buffers', () => {
  const system = createSystem({
    particles: Array.from({ length: 6 }, (_, id) => ({ id })),
    floatingText: Array.from({ length: 4 }, (_, id) => ({ id })),
  });
  dispatchParticleSystemQuality(system, 0.5, {
    resolveBudgets: () => ({
      maxParticles: 4,
      maxFloatingText: 2,
    }),
  });

  assert.equal(system.maxParticles, 4);
  assert.equal(system.maxFloatingText, 2);
  assert.deepEqual(system.particles.map((entry) => entry.id), [2, 3, 4, 5]);
  assert.deepEqual(system.floatingText.map((entry) => entry.id), [2, 3]);
});

test('dispatchParticleSystemBurst injects cap into append payload', () => {
  const calls = [];
  const system = createSystem({ maxParticles: 7 });
  dispatchParticleSystemBurst(system, { x: 1, z: 2, kind: 'smoke' }, {
    appendBurst: (payload) => calls.push(payload),
  });
  assert.deepEqual(calls, [{
    particles: system.particles,
    x: 1,
    z: 2,
    kind: 'smoke',
    maxParticles: 7,
  }]);
});

test('dispatchParticleSystemFloatingText injects floating text cap', () => {
  const calls = [];
  const system = createSystem({ maxFloatingText: 3 });
  dispatchParticleSystemFloatingText(system, { x: 4, z: 5, text: '+2 wood' }, {
    appendText: (payload) => calls.push(payload),
  });
  assert.deepEqual(calls, [{
    floatingText: system.floatingText,
    maxFloatingText: 3,
    x: 4,
    z: 5,
    text: '+2 wood',
  }]);
});

test('dispatchParticleSystemUpdate skips non-positive deltas and updates entries', () => {
  const system = createSystem({
    particles: [{ id: 'p' }],
    floatingText: [{ id: 't' }],
  });
  let particleUpdateCalls = 0;
  let textUpdateCalls = 0;
  dispatchParticleSystemUpdate(system, 0, {
    updateParticleEntries: () => {
      particleUpdateCalls += 1;
      return [];
    },
    updateTextEntries: () => {
      textUpdateCalls += 1;
      return [];
    },
  });
  assert.equal(particleUpdateCalls, 0);
  assert.equal(textUpdateCalls, 0);
  assert.deepEqual(system.particles, [{ id: 'p' }]);
  assert.deepEqual(system.floatingText, [{ id: 't' }]);

  dispatchParticleSystemUpdate(system, 0.1, {
    updateParticleEntries: () => {
      particleUpdateCalls += 1;
      return [{ id: 'next-p' }];
    },
    updateTextEntries: () => {
      textUpdateCalls += 1;
      return [{ id: 'next-t' }];
    },
  });
  assert.equal(particleUpdateCalls, 1);
  assert.equal(textUpdateCalls, 1);
  assert.deepEqual(system.particles, [{ id: 'next-p' }]);
  assert.deepEqual(system.floatingText, [{ id: 'next-t' }]);
});

test('buildParticleSystemRenderables passes current buffers and camera', () => {
  const system = createSystem({
    particles: [{ id: 'p' }],
    floatingText: [{ id: 't' }],
  });
  const camera = { zoom: 2 };
  const calls = [];
  const renderables = [{ draw: () => {} }];
  const result = buildParticleSystemRenderables(system, camera, {
    buildRenderables: (payload) => {
      calls.push(payload);
      return renderables;
    },
  });
  assert.deepEqual(calls, [{
    particles: system.particles,
    floatingText: system.floatingText,
    camera,
  }]);
  assert.equal(result, renderables);
});
