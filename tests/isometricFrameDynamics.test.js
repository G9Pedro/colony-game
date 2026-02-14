import test from 'node:test';
import assert from 'node:assert/strict';
import { runIsometricFrameDynamics } from '../src/render/isometricFrameDynamics.js';

test('runIsometricFrameDynamics updates frame-driven systems with expected values', () => {
  const calls = [];
  const state = { maxWorldRadius: 33, resources: { wood: 10 } };
  const frame = { deltaSeconds: 0.08, now: 2400 };
  const qualityController = {
    recordFrame: (deltaSeconds) => calls.push(['recordFrame', deltaSeconds]),
    getParticleMultiplier: () => {
      calls.push(['getParticleMultiplier']);
      return 0.72;
    },
  };
  const camera = {
    setWorldRadius: (radius) => calls.push(['setWorldRadius', radius]),
    update: (deltaSeconds) => calls.push(['cameraUpdate', deltaSeconds]),
  };
  const particles = {
    setQuality: (quality) => calls.push(['setQuality', quality]),
    update: (deltaSeconds) => calls.push(['particlesUpdate', deltaSeconds]),
  };

  runIsometricFrameDynamics({
    state,
    frame,
    qualityController,
    camera,
    particles,
    sampleResourceGains: (nextState, deltaSeconds) => calls.push(['sampleResourceGains', nextState, deltaSeconds]),
    syncBuildingAnimations: (nextState, now) => calls.push(['syncBuildingAnimations', nextState, now]),
    updateColonistInterpolation: (nextState, deltaSeconds) =>
      calls.push(['updateColonistInterpolation', nextState, deltaSeconds]),
    maybeEmitBuildingEffects: (nextState, deltaSeconds) =>
      calls.push(['maybeEmitBuildingEffects', nextState, deltaSeconds]),
  });

  assert.deepEqual(calls, [
    ['recordFrame', 0.08],
    ['setWorldRadius', 33],
    ['cameraUpdate', 0.08],
    ['getParticleMultiplier'],
    ['setQuality', 0.72],
    ['particlesUpdate', 0.08],
    ['sampleResourceGains', state, 0.08],
    ['syncBuildingAnimations', state, 2400],
    ['updateColonistInterpolation', state, 0.08],
    ['maybeEmitBuildingEffects', state, 0.08],
  ]);
});

