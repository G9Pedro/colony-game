import test from 'node:test';
import assert from 'node:assert/strict';
import {
  emitAmbientBuildingEffects,
  maybeEmitResourceGainFloatingText,
  syncPlacementAnimationEffects,
} from '../src/render/isometricRuntimeEffects.js';

test('syncPlacementAnimationEffects registers placement animations and optional dust bursts', () => {
  const animationCalls = [];
  const particleCalls = [];
  const nextIds = new Set(['a', 'b']);
  const result = syncPlacementAnimationEffects({
    buildings: [{ id: 'a', x: 2, z: 3 }],
    knownBuildingIds: new Set(),
    now: 10,
    animations: {
      registerPlacement: (id, nowValue, duration) =>
        animationCalls.push({ id, now: nowValue, duration }),
    },
    effectsEnabled: true,
    particles: {
      emitBurst: (payload) => particleCalls.push(payload),
    },
    diffPlacements: () => ({
      nextIds,
      newBuildings: [{ id: 'a', x: 2, z: 3 }],
    }),
  });

  assert.equal(result, nextIds);
  assert.deepEqual(animationCalls, [{ id: 'a', now: 10, duration: 320 }]);
  assert.deepEqual(particleCalls, [
    {
      x: 2,
      z: 3,
      kind: 'dust',
      count: 10,
      color: 'rgba(193, 153, 104, 0.72)',
    },
  ]);
});

test('maybeEmitResourceGainFloatingText emits first gain with deterministic origin', () => {
  const floatingTextCalls = [];
  const emitted = maybeEmitResourceGainFloatingText({
    gains: [{ resource: 'wood', delta: 6.8 }],
    state: {
      buildings: [
        { x: 1, z: 1 },
        { x: 4, z: 2 },
      ],
    },
    effectsEnabled: true,
    shouldRunOptionalEffects: true,
    particles: {
      emitFloatingText: (payload) => floatingTextCalls.push(payload),
    },
    camera: { centerX: 10, centerZ: 11 },
    random: () => 0.95,
  });

  assert.equal(emitted, true);
  assert.deepEqual(floatingTextCalls, [
    {
      x: 4,
      z: 2,
      text: '+6 wood',
      color: '#f4ead0',
    },
  ]);
});

test('maybeEmitResourceGainFloatingText falls back to camera center without buildings', () => {
  const floatingTextCalls = [];
  maybeEmitResourceGainFloatingText({
    gains: [{ resource: 'stone', delta: 4.1 }],
    state: { buildings: [] },
    effectsEnabled: true,
    shouldRunOptionalEffects: true,
    particles: {
      emitFloatingText: (payload) => floatingTextCalls.push(payload),
    },
    camera: { centerX: 9, centerZ: 8 },
    random: () => 0.4,
  });

  assert.deepEqual(floatingTextCalls, [
    {
      x: 9,
      z: 8,
      text: '+4 stone',
      color: '#f4ead0',
    },
  ]);
});

test('emitAmbientBuildingEffects emits all collected bursts when enabled', () => {
  const emittedBursts = [];
  const state = { buildings: [{ id: 'b' }] };
  const emittedCount = emitAmbientBuildingEffects({
    state,
    deltaSeconds: 0.5,
    effectsEnabled: true,
    shouldRunOptionalEffects: true,
    qualityMultiplier: 0.8,
    particles: {
      emitBurst: (burst) => emittedBursts.push(burst),
    },
    collectBursts: (buildings, options) => {
      assert.equal(buildings, state.buildings);
      assert.deepEqual(options, { deltaSeconds: 0.5, qualityMultiplier: 0.8 });
      return [{ kind: 'smoke', x: 1, z: 2 }, { kind: 'spark', x: 3, z: 4 }];
    },
  });

  assert.equal(emittedCount, 2);
  assert.deepEqual(emittedBursts, [
    { kind: 'smoke', x: 1, z: 2 },
    { kind: 'spark', x: 3, z: 4 },
  ]);
});

test('emitAmbientBuildingEffects skips work when effects are disabled', () => {
  let collectCalls = 0;
  const emittedCount = emitAmbientBuildingEffects({
    state: { buildings: [] },
    deltaSeconds: 0.5,
    effectsEnabled: false,
    shouldRunOptionalEffects: true,
    qualityMultiplier: 1,
    particles: {
      emitBurst: () => {
        throw new Error('should not emit');
      },
    },
    collectBursts: () => {
      collectCalls += 1;
      return [];
    },
  });

  assert.equal(emittedCount, 0);
  assert.equal(collectCalls, 0);
});

