import test from 'node:test';
import assert from 'node:assert/strict';
import { hash2d, shadeColor } from '../src/render/spriteMath.js';

test('shadeColor scales rgb channels and clamps bounds', () => {
  assert.equal(shadeColor('#808080', 0.5), 'rgb(64 64 64)');
  assert.equal(shadeColor('#ffffff', 2), 'rgb(255 255 255)');
  assert.equal(shadeColor('#000000', 0.5), 'rgb(0 0 0)');
});

test('hash2d returns deterministic normalized pseudo-random values', () => {
  const first = hash2d(1.23, 4.56, 7.89);
  const second = hash2d(1.23, 4.56, 7.89);
  const third = hash2d(1.23, 4.56, 7.9);

  assert.equal(first, second);
  assert.ok(first >= 0 && first < 1);
  assert.ok(third >= 0 && third < 1);
  assert.notEqual(first, third);
});

