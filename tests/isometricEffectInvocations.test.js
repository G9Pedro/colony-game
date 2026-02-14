import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildIsometricAmbientEffectInvocation,
  buildIsometricPlacementEffectInvocation,
  buildIsometricResourceGainEffectInvocation,
} from '../src/render/isometricEffectInvocations.js';

test('buildIsometricPlacementEffectInvocation maps placement animation dependencies', () => {
  const renderer = {
    knownBuildingIds: new Set(['a']),
    animations: { id: 'animations' },
    options: { effectsEnabled: true },
    particles: { id: 'particles' },
  };
  const state = { buildings: [{ id: 'a' }] };

  assert.deepEqual(buildIsometricPlacementEffectInvocation(renderer, state, 22), {
    buildings: state.buildings,
    knownBuildingIds: renderer.knownBuildingIds,
    now: 22,
    animations: renderer.animations,
    effectsEnabled: true,
    particles: renderer.particles,
  });
});

test('buildIsometricResourceGainEffectInvocation maps gain text emission payload', () => {
  const renderer = {
    options: { effectsEnabled: false },
    qualityController: {
      shouldRunOptionalEffects: () => true,
    },
    particles: { id: 'particles' },
    camera: { id: 'camera' },
  };
  const gains = [{ id: 'wood', delta: 5 }];
  const state = { tick: 8 };

  assert.deepEqual(buildIsometricResourceGainEffectInvocation(renderer, gains, state), {
    gains,
    state,
    effectsEnabled: false,
    shouldRunOptionalEffects: true,
    particles: renderer.particles,
    camera: renderer.camera,
  });
});

test('buildIsometricAmbientEffectInvocation maps ambient burst emission payload', () => {
  const renderer = {
    options: { effectsEnabled: true },
    qualityController: {
      shouldRunOptionalEffects: () => false,
      getParticleMultiplier: () => 0.5,
    },
    particles: { id: 'particles' },
  };
  const state = { buildings: [] };

  assert.deepEqual(buildIsometricAmbientEffectInvocation(renderer, state, 0.16), {
    state,
    deltaSeconds: 0.16,
    effectsEnabled: true,
    shouldRunOptionalEffects: false,
    qualityMultiplier: 0.5,
    particles: renderer.particles,
  });
});

