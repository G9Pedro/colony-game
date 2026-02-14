import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyIsometricSelectedEntity,
  buildIsometricClickSelectionInvocation,
  buildIsometricHoverSelectionInvocation,
} from '../src/render/isometricSelectionState.js';

test('applyIsometricSelectedEntity updates selected entity and notifies listeners', () => {
  const calls = [];
  const renderer = {
    selectedEntity: { id: 'old' },
    onEntitySelect: (entity) => calls.push(entity),
  };

  applyIsometricSelectedEntity(renderer, { id: 'next' });
  assert.deepEqual(renderer.selectedEntity, { id: 'next' });
  assert.deepEqual(calls, [{ id: 'next' }]);

  applyIsometricSelectedEntity(renderer, undefined);
  assert.equal(renderer.selectedEntity, null);
  assert.deepEqual(calls, [{ id: 'next' }, null]);
});

test('buildIsometricHoverSelectionInvocation maps hover payload and setter', () => {
  const renderer = {
    interactiveEntities: [{ id: 1 }],
    hoveredEntity: null,
  };
  const invocation = buildIsometricHoverSelectionInvocation(renderer, 4, 7);

  assert.equal(invocation.interactiveEntities, renderer.interactiveEntities);
  assert.equal(invocation.localX, 4);
  assert.equal(invocation.localY, 7);
  invocation.setHoveredEntity({ id: 9 });
  assert.deepEqual(renderer.hoveredEntity, { id: 9 });
});

test('buildIsometricClickSelectionInvocation maps click payload with selection applier', () => {
  const notifications = [];
  const renderer = {
    interactiveEntities: [{ id: 2 }],
    lastState: { selectedBuildingType: 'hut' },
    onGroundClick: () => {},
    onEntitySelect: (entity) => notifications.push(entity),
  };
  const tile = { x: 1, z: -2 };
  const invocation = buildIsometricClickSelectionInvocation(renderer, 5, 6, tile);

  assert.equal(invocation.interactiveEntities, renderer.interactiveEntities);
  assert.equal(invocation.localX, 5);
  assert.equal(invocation.localY, 6);
  assert.equal(invocation.tile, tile);
  assert.equal(invocation.selectedBuildingType, 'hut');
  assert.equal(invocation.onGroundClick, renderer.onGroundClick);

  invocation.setSelectedEntity({ id: 'entity' });
  assert.deepEqual(renderer.selectedEntity, { id: 'entity' });
  assert.deepEqual(notifications, [{ id: 'entity' }]);
});

