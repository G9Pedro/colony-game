import test from 'node:test';
import assert from 'node:assert/strict';
import {
  handleIsometricClickSelection,
  updateIsometricHoverSelection,
} from '../src/render/isometricInteractionHandlers.js';

test('updateIsometricHoverSelection maps hit to hovered entity', () => {
  const hovered = [];
  const entity = { type: 'building', id: 'b1' };
  const result = updateIsometricHoverSelection({
    interactiveEntities: [{ entity }],
    localX: 4,
    localY: 5,
    setHoveredEntity: (next) => hovered.push(next),
    pickHit: (entities, localX, localY) => {
      assert.equal(entities.length, 1);
      assert.equal(localX, 4);
      assert.equal(localY, 5);
      return { entity };
    },
  });

  assert.equal(result, entity);
  assert.deepEqual(hovered, [entity]);
});

test('updateIsometricHoverSelection clears hovered entity when nothing is hit', () => {
  const hovered = [];
  const result = updateIsometricHoverSelection({
    interactiveEntities: [],
    localX: 1,
    localY: 2,
    setHoveredEntity: (next) => hovered.push(next),
    pickHit: () => null,
  });

  assert.equal(result, null);
  assert.deepEqual(hovered, [null]);
});

test('handleIsometricClickSelection applies selection and optional ground click', () => {
  const selected = [];
  const groundClicks = [];
  const hitEntity = { type: 'colonist', id: 'c2' };

  const outcome = handleIsometricClickSelection({
    interactiveEntities: [{ entity: hitEntity }],
    localX: 10,
    localY: 20,
    tile: { x: 7, z: -3 },
    selectedBuildingType: null,
    setSelectedEntity: (entity) => selected.push(entity),
    onGroundClick: (point) => groundClicks.push(point),
    pickHit: () => ({ entity: hitEntity }),
    resolveClickOutcome: ({ selectedBuildingType, hitEntity: incomingHitEntity }) => {
      assert.equal(selectedBuildingType, null);
      assert.equal(incomingHitEntity, hitEntity);
      return {
        selectionAction: 'set',
        selectedEntity: hitEntity,
        shouldGroundClick: true,
      };
    },
  });

  assert.deepEqual(outcome, {
    selectionAction: 'set',
    selectedEntity: hitEntity,
    shouldGroundClick: true,
  });
  assert.deepEqual(selected, [hitEntity]);
  assert.deepEqual(groundClicks, [{ x: 7, z: -3 }]);
});

test('handleIsometricClickSelection supports selection clear without ground callback', () => {
  const selected = [];
  const outcome = handleIsometricClickSelection({
    interactiveEntities: [],
    localX: 0,
    localY: 0,
    tile: { x: 0, z: 0 },
    selectedBuildingType: 'house',
    setSelectedEntity: (entity) => selected.push(entity),
    onGroundClick: null,
    pickHit: () => null,
    resolveClickOutcome: () => ({
      selectionAction: 'clear',
      shouldGroundClick: false,
    }),
  });

  assert.deepEqual(outcome, {
    selectionAction: 'clear',
    shouldGroundClick: false,
  });
  assert.deepEqual(selected, [null]);
});

