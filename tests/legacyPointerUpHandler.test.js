import test from 'node:test';
import assert from 'node:assert/strict';
import { handleLegacyPointerUpEvent } from '../src/render/legacyPointerUpHandler.js';

test('handleLegacyPointerUpEvent emits entity selection outcome', () => {
  const selected = [];
  const groundClicks = [];
  const dragState = { active: true };
  const entity = { type: 'building', id: 'b-1' };

  const outcome = handleLegacyPointerUpEvent({
    event: { clientX: 0, clientY: 0 },
    dragState,
    onEntitySelect: (value) => selected.push(value),
    onGroundClick: (point) => groundClicks.push(point),
    screenToEntity: () => entity,
    screenToGround: () => ({ x: 1, z: 2 }),
    endPointerDrag: (state) => ({ state, clientX: 10, clientY: 11, moved: false }),
    resolvePointerUpOutcome: ({ dragEnd, pickEntity, pickGround, roundGroundPoint }) => {
      assert.equal(dragEnd.clientX, 10);
      assert.equal(typeof pickEntity, 'function');
      assert.equal(typeof pickGround, 'function');
      assert.equal(typeof roundGroundPoint, 'function');
      return { type: 'select-entity', entity };
    },
  });

  assert.deepEqual(outcome, { type: 'select-entity', entity });
  assert.deepEqual(selected, [entity]);
  assert.deepEqual(groundClicks, []);
});

test('handleLegacyPointerUpEvent emits ground click and ignores none outcomes', () => {
  const selected = [];
  const groundClicks = [];

  const groundOutcome = handleLegacyPointerUpEvent({
    event: { clientX: 0, clientY: 0 },
    dragState: {},
    onEntitySelect: (value) => selected.push(value),
    onGroundClick: (point) => groundClicks.push(point),
    screenToEntity: () => null,
    screenToGround: () => ({ x: 2, z: 3 }),
    endPointerDrag: () => ({ moved: false, clientX: 2, clientY: 3 }),
    resolvePointerUpOutcome: () => ({ type: 'ground-click', point: { x: 2, z: 3 } }),
  });
  const noneOutcome = handleLegacyPointerUpEvent({
    event: { clientX: 0, clientY: 0 },
    dragState: {},
    onEntitySelect: (value) => selected.push(value),
    onGroundClick: (point) => groundClicks.push(point),
    screenToEntity: () => null,
    screenToGround: () => null,
    endPointerDrag: () => ({ moved: true }),
    resolvePointerUpOutcome: () => ({ type: 'none' }),
  });

  assert.deepEqual(groundOutcome, { type: 'ground-click', point: { x: 2, z: 3 } });
  assert.deepEqual(noneOutcome, { type: 'none' });
  assert.deepEqual(groundClicks, [{ x: 2, z: 3 }]);
  assert.deepEqual(selected, []);
});

