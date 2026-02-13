import test from 'node:test';
import assert from 'node:assert/strict';
import { mapClientToLocalPoint } from '../src/render/interactionController.js';

test('mapClientToLocalPoint converts viewport coordinates to local canvas point', () => {
  const rect = { left: 120, top: 60 };
  const local = mapClientToLocalPoint(200, 145, rect);
  assert.deepEqual(local, { x: 80, y: 85 });
});

