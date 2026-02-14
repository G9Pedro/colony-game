import test from 'node:test';
import assert from 'node:assert/strict';
import { buildEntitySelectionFromObject, clientToNdc } from '../src/render/legacyRaycastUtils.js';

test('clientToNdc converts viewport coordinates to normalized device coordinates', () => {
  const rect = { left: 100, top: 50, width: 200, height: 100 };
  assert.deepEqual(clientToNdc(200, 100, rect), { x: 0, y: 0 });
  assert.deepEqual(clientToNdc(100, 50, rect), { x: -1, y: 1 });
});

test('buildEntitySelectionFromObject maps userData to selection payload', () => {
  const building = buildEntitySelectionFromObject({
    userData: { entityId: 'b1', entityType: 'building' },
    position: { x: 4, z: -2 },
  });
  assert.deepEqual(building, {
    type: 'building',
    id: 'b1',
    buildingId: 'b1',
    x: 4,
    z: -2,
  });

  const colonist = buildEntitySelectionFromObject({
    userData: { entityId: 'c1', entityType: 'colonist' },
    position: { x: 3, z: 5 },
  });
  assert.deepEqual(colonist, {
    type: 'colonist',
    id: 'c1',
    colonistId: 'c1',
    x: 3,
    z: 5,
  });
});

test('buildEntitySelectionFromObject returns null for invalid objects', () => {
  assert.equal(buildEntitySelectionFromObject(null), null);
  assert.equal(buildEntitySelectionFromObject({ userData: {}, position: { x: 0, z: 0 } }), null);
});

