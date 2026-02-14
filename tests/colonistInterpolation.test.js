import test from 'node:test';
import assert from 'node:assert/strict';
import { getColonistInterpolationFactor, updateColonistRenderState } from '../src/render/colonistInterpolation.js';

test('getColonistInterpolationFactor clamps to expected range', () => {
  assert.equal(getColonistInterpolationFactor(0), 0.12);
  assert.equal(getColonistInterpolationFactor(0.2), 1);
  assert.equal(getColonistInterpolationFactor(0.01), 0.12);
});

test('updateColonistRenderState interpolates alive colonists and prunes stale entries', () => {
  const renderStateMap = new Map([
    ['alive-1', { x: 0, z: 0 }],
    ['stale', { x: 99, z: 99 }],
  ]);
  const colonists = [
    { id: 'alive-1', alive: true, position: { x: 10, z: -6 } },
    { id: 'alive-2', alive: true, position: { x: -4, z: 3 } },
    { id: 'dead-1', alive: false, position: { x: 2, z: 2 } },
  ];

  updateColonistRenderState(colonists, renderStateMap, 0.05);

  assert.equal(renderStateMap.has('stale'), false);
  assert.equal(renderStateMap.has('dead-1'), false);
  assert.equal(renderStateMap.has('alive-2'), true);
  const alive1 = renderStateMap.get('alive-1');
  assert.ok(alive1.x > 0 && alive1.x < 10);
  assert.ok(alive1.z < 0 && alive1.z > -6);
});

