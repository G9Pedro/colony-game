import test from 'node:test';
import assert from 'node:assert/strict';
import { computeColonistBobOffset, getColonistAnimationFrame } from '../src/render/entityAnimationPolicies.js';

test('getColonistAnimationFrame maps time and age to deterministic frame index', () => {
  assert.equal(getColonistAnimationFrame(0, 0), 0);
  assert.equal(getColonistAnimationFrame(0.2, 0), 1);
  assert.equal(getColonistAnimationFrame(0.4, 0), 2);
  assert.equal(getColonistAnimationFrame(0.6, 0), 0);
  assert.equal(getColonistAnimationFrame(0.2, 0.5), 1);
});

test('computeColonistBobOffset uses idle and active oscillation profiles', () => {
  const idleOffset = computeColonistBobOffset(1.25, 0.5, true);
  const activeOffset = computeColonistBobOffset(1.25, 0.5, false);

  assert.ok(Math.abs(idleOffset - Math.sin(1.75 * 2.5) * 1.5) < 0.0000001);
  assert.ok(Math.abs(activeOffset - Math.sin(1.75 * 11) * 1.4) < 0.0000001);
  assert.notEqual(idleOffset, activeOffset);
});

