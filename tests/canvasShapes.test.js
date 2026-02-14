import test from 'node:test';
import assert from 'node:assert/strict';
import { traceRoundedRectPath } from '../src/render/canvasShapes.js';

test('traceRoundedRectPath emits expected canvas path commands', () => {
  const calls = [];
  const ctx = {
    beginPath: () => calls.push(['beginPath']),
    moveTo: (...args) => calls.push(['moveTo', ...args]),
    lineTo: (...args) => calls.push(['lineTo', ...args]),
    quadraticCurveTo: (...args) => calls.push(['quadraticCurveTo', ...args]),
    closePath: () => calls.push(['closePath']),
  };

  traceRoundedRectPath(ctx, 10, 20, 80, 50, 6);

  assert.deepEqual(calls, [
    ['beginPath'],
    ['moveTo', 16, 20],
    ['lineTo', 84, 20],
    ['quadraticCurveTo', 90, 20, 90, 26],
    ['lineTo', 90, 64],
    ['quadraticCurveTo', 90, 70, 84, 70],
    ['lineTo', 16, 70],
    ['quadraticCurveTo', 10, 70, 10, 64],
    ['lineTo', 10, 26],
    ['quadraticCurveTo', 10, 20, 16, 20],
    ['closePath'],
  ]);
});

