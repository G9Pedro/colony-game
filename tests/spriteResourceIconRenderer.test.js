import test from 'node:test';
import assert from 'node:assert/strict';
import { drawResourceIconSprite, resolveResourceGlyph } from '../src/render/spriteResourceIconRenderer.js';

function createResourceContextStub() {
  const calls = [];
  return {
    calls,
    beginPath: () => calls.push(['beginPath']),
    roundRect: (...args) => calls.push(['roundRect', ...args]),
    fill: () => calls.push(['fill']),
    fillText: (...args) => calls.push(['fillText', ...args]),
    set fillStyle(value) {
      calls.push(['fillStyle', value]);
    },
    set font(value) {
      calls.push(['font', value]);
    },
    set textAlign(value) {
      calls.push(['textAlign', value]);
    },
    set textBaseline(value) {
      calls.push(['textBaseline', value]);
    },
  };
}

test('resolveResourceGlyph falls back to default dot when missing', () => {
  assert.equal(resolveResourceGlyph('wood', { wood: '🪵' }), '🪵');
  assert.equal(resolveResourceGlyph('unknown', { wood: '🪵' }), '●');
});

test('drawResourceIconSprite renders chip background and centered glyph text', () => {
  const ctx = createResourceContextStub();
  drawResourceIconSprite(ctx, {
    resourceKey: 'stone',
    size: 24,
    resourceGlyphs: { stone: '⬢' },
  });

  assert.deepEqual(ctx.calls.slice(0, 4), [
    ['fillStyle', 'rgba(82, 53, 28, 0.85)'],
    ['beginPath'],
    ['roundRect', 0, 0, 24, 24, 6],
    ['fill'],
  ]);
  assert.ok(ctx.calls.some((call) => call[0] === 'font' && call[1] === '17px serif'));
  assert.ok(ctx.calls.some((call) => call[0] === 'fillText' && call[1] === '⬢' && call[2] === 12 && call[3] === 12.96));
});

