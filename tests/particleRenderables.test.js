import test from 'node:test';
import assert from 'node:assert/strict';
import { buildParticleRenderables } from '../src/render/particleRenderables.js';

function createContextSpy() {
  const calls = [];
  const ctx = {
    save: () => calls.push(['save']),
    restore: () => calls.push(['restore']),
    beginPath: () => calls.push(['beginPath']),
    arc: (...args) => calls.push(['arc', ...args]),
    fill: () => calls.push(['fill']),
    moveTo: (...args) => calls.push(['moveTo', ...args]),
    lineTo: (...args) => calls.push(['lineTo', ...args]),
    stroke: () => calls.push(['stroke']),
    fillText: (...args) => calls.push(['fillText', ...args]),
    set globalAlpha(value) {
      calls.push(['globalAlpha', value]);
    },
    set fillStyle(value) {
      calls.push(['fillStyle', value]);
    },
    set strokeStyle(value) {
      calls.push(['strokeStyle', value]);
    },
    set lineWidth(value) {
      calls.push(['lineWidth', value]);
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
  return { ctx, calls };
}

test('buildParticleRenderables maps particles and floating text into drawable entries', () => {
  const camera = {
    zoom: 1.5,
    worldToScreen: (x, z) => ({ x: x * 10, y: z * 10 }),
  };
  const renderables = buildParticleRenderables({
    camera,
    particles: [{
      x: 2,
      z: 3,
      y: 0.5,
      age: 0.25,
      lifetime: 1,
      size: 2,
      color: '#c96',
      kind: 'sparkle',
    }],
    floatingText: [{
      x: -1,
      z: 4,
      y: 0.4,
      age: 0.1,
      lifetime: 0.5,
      text: '+5 wood',
      color: '#ffd',
    }],
  });

  assert.equal(renderables.length, 2);
  assert.equal(renderables[0].depth, 5.4);
  assert.equal(renderables[1].depth, 3.8);

  const particleCtx = createContextSpy();
  renderables[0].draw(particleCtx.ctx);
  assert.ok(particleCtx.calls.some((entry) => entry[0] === 'arc'));
  assert.ok(particleCtx.calls.some((entry) => entry[0] === 'stroke'));

  const textCtx = createContextSpy();
  renderables[1].draw(textCtx.ctx);
  assert.ok(textCtx.calls.some((entry) => entry[0] === 'font' && entry[1].includes('Trebuchet MS')));
  assert.ok(textCtx.calls.some((entry) => entry[0] === 'fillText' && entry[1] === '+5 wood'));
});
