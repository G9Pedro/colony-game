import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveClickSelectionOutcome } from '../src/render/clickSelection.js';

test('resolveClickSelectionOutcome selects hit entity when not placing', () => {
  const entity = { id: 'b-1' };
  const outcome = resolveClickSelectionOutcome({
    selectedBuildingType: null,
    hitEntity: entity,
  });
  assert.deepEqual(outcome, {
    selectionAction: 'set',
    selectedEntity: entity,
    shouldGroundClick: false,
  });
});

test('resolveClickSelectionOutcome clears selection and allows ground click when not placing', () => {
  const outcome = resolveClickSelectionOutcome({
    selectedBuildingType: null,
    hitEntity: null,
  });
  assert.deepEqual(outcome, {
    selectionAction: 'clear',
    selectedEntity: null,
    shouldGroundClick: true,
  });
});

test('resolveClickSelectionOutcome keeps selection while placing buildings', () => {
  const outcome = resolveClickSelectionOutcome({
    selectedBuildingType: 'farm',
    hitEntity: { id: 'b-2' },
  });
  assert.deepEqual(outcome, {
    selectionAction: 'keep',
    selectedEntity: null,
    shouldGroundClick: true,
  });
});

