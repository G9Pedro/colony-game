import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildBuildingSpriteMetrics,
  resolveBuildingNoiseStrength,
  resolveBuildingSurfaceColors,
} from '../src/render/spriteBuildingRenderingPolicies.js';

test('resolveBuildingSurfaceColors uses overrides with safe defaults', () => {
  assert.deepEqual(resolveBuildingSurfaceColors({}), {
    roofColor: '#9a5f3b',
    wallColor: '#a18b73',
  });
  assert.deepEqual(resolveBuildingSurfaceColors({ roof: '#111', wall: '#222' }), {
    roofColor: '#111',
    wallColor: '#222',
  });
});

test('resolveBuildingNoiseStrength maps quality tiers to deterministic strengths', () => {
  assert.equal(resolveBuildingNoiseStrength('high'), 0.2);
  assert.equal(resolveBuildingNoiseStrength('balanced'), 0.09);
  assert.equal(resolveBuildingNoiseStrength('low'), 0.09);
});

test('buildBuildingSpriteMetrics maps geometry values to anchor payload', () => {
  assert.deepEqual(buildBuildingSpriteMetrics({
    centerX: 80,
    baseY: 100,
    width: 44,
    depth: 22,
  }), {
    anchorX: 80,
    anchorY: 113,
    width: 44,
    depth: 22,
  });
});

