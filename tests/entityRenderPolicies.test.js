import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeConstructionProgress,
  createBuildingInteractiveEntity,
  createColonistInteractiveEntity,
  shouldRenderNightWindowGlow,
} from '../src/render/entityRenderPolicies.js';

test('computeConstructionProgress clamps progress into [0,1]', () => {
  assert.equal(computeConstructionProgress(5, 10), 0.5);
  assert.equal(computeConstructionProgress(-5, 10), 0);
  assert.equal(computeConstructionProgress(999, 0), 1);
});

test('shouldRenderNightWindowGlow only enables supported building types at night', () => {
  assert.equal(shouldRenderNightWindowGlow(0.2, 'house'), true);
  assert.equal(shouldRenderNightWindowGlow(0.2, 'quarry'), false);
  assert.equal(shouldRenderNightWindowGlow(0.7, 'house'), false);
});

test('createBuildingInteractiveEntity maps selection hitbox payload', () => {
  const payload = createBuildingInteractiveEntity({
    building: { id: 'b-1', type: 'house', x: 4, z: 7 },
    screen: { x: 120, y: 90 },
    drawW: 100,
    drawH: 80,
    depth: 11.15,
  });

  assert.deepEqual(payload, {
    entity: {
      type: 'building',
      id: 'b-1',
      buildingType: 'house',
      x: 4,
      z: 7,
    },
    centerX: 120,
    centerY: 78,
    halfWidth: 20,
    halfHeight: 16,
    depth: 11.15,
  });
});

test('createColonistInteractiveEntity maps selection hitbox payload', () => {
  const payload = createColonistInteractiveEntity({
    colonist: { id: 'c-1' },
    renderState: { x: 8.5, z: -3.2 },
    screen: { x: 42, y: 75 },
    drawW: 24,
    drawH: 30,
    depth: 5.58,
  });

  assert.deepEqual(payload.entity, {
    type: 'colonist',
    id: 'c-1',
    colonistId: 'c-1',
    x: 8.5,
    z: -3.2,
  });
  assert.equal(payload.centerX, 42);
  assert.equal(payload.centerY, 69);
  assert.ok(Math.abs(payload.halfWidth - 8.4) < 0.0000001);
  assert.equal(payload.halfHeight, 15);
  assert.equal(payload.depth, 5.58);
});

