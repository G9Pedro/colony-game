import test from 'node:test';
import assert from 'node:assert/strict';
import { drawColonistSprite, resolveColonistAnimationOffsets } from '../src/render/spriteColonistRenderer.js';

function createColonistContextStub() {
  const calls = [];
  return {
    calls,
    beginPath: () => calls.push(['beginPath']),
    ellipse: (...args) => calls.push(['ellipse', ...args]),
    arc: (...args) => calls.push(['arc', ...args]),
    moveTo: (...args) => calls.push(['moveTo', ...args]),
    lineTo: (...args) => calls.push(['lineTo', ...args]),
    roundRect: (...args) => calls.push(['roundRect', ...args]),
    fill: () => calls.push(['fill']),
    stroke: () => calls.push(['stroke']),
    set fillStyle(value) {
      calls.push(['fillStyle', value]);
    },
    set strokeStyle(value) {
      calls.push(['strokeStyle', value]);
    },
    set lineWidth(value) {
      calls.push(['lineWidth', value]);
    },
  };
}

test('resolveColonistAnimationOffsets returns expected walk and idle offsets', () => {
  assert.deepEqual(resolveColonistAnimationOffsets(1, false), { legSwing: -1.5, bodyLift: 0 });
  const idleOffsets = resolveColonistAnimationOffsets(2, true);
  assert.equal(idleOffsets.legSwing, 0);
  assert.ok(Math.abs(idleOffsets.bodyLift - (Math.sin(1.6) * 0.6)) < 0.0000001);
});

test('drawColonistSprite renders silhouette and body details', () => {
  const ctx = createColonistContextStub();
  drawColonistSprite(ctx, {
    job: 'builder',
    frame: 1,
    idle: false,
    jobColors: { laborer: '#aaa', builder: '#ff7f50' },
    shade: (color, factor) => `${color}:${factor}`,
  });

  assert.deepEqual(ctx.calls[0], ['fillStyle', 'rgba(20, 18, 14, 0.22)']);
  assert.ok(ctx.calls.some((call) => call[0] === 'strokeStyle' && call[1] === '#ff7f50:0.7'));
  assert.ok(ctx.calls.some((call) => call[0] === 'roundRect'));
  assert.ok(ctx.calls.some((call) => call[0] === 'arc'));
});

