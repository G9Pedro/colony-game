import test from 'node:test';
import assert from 'node:assert/strict';
import { AnimationManager, easeOutBack, easeOutCubic } from '../src/render/animations.js';

test('easing helpers clamp to expected bounds', () => {
  assert.equal(easeOutCubic(0), 0);
  assert.equal(easeOutCubic(1), 1);
  assert.ok(easeOutCubic(0.5) > 0.5);

  assert.equal(Math.round(easeOutBack(0) * 1000) / 1000, 0);
  assert.equal(Math.round(easeOutBack(1) * 1000) / 1000, 1);
});

test('placement animation converges to scale 1', () => {
  const manager = new AnimationManager();
  manager.registerPlacement('building-1', 1000, 300);

  const early = manager.getPlacementScale('building-1', 1080);
  const settled = manager.getPlacementScale('building-1', 1500);
  assert.ok(early > 0.5);
  assert.equal(settled, 1);
});

test('value tween interpolates between updates', () => {
  const manager = new AnimationManager();
  manager.tweenValue('resource:wood', 10, 1000, 200);
  const start = manager.tweenValue('resource:wood', 30, 1100, 200);
  const middle = manager.getTweenedValue('resource:wood', 1180);
  const end = manager.getTweenedValue('resource:wood', 1450);

  assert.ok(start >= 10 && start <= 30);
  assert.ok(middle > start && middle < 30);
  assert.equal(end, 30);
});

