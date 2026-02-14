import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveLegacyPointerUpOutcome } from '../src/render/legacyInteractionOutcomes.js';

test('resolveLegacyPointerUpOutcome returns none for inactive or moved drags', () => {
  const inactive = resolveLegacyPointerUpOutcome({
    dragEnd: { active: false, moved: false, clientX: 0, clientY: 0 },
    pickEntity: () => ({ id: 'x' }),
    pickGround: () => ({ x: 1, y: 0, z: 2 }),
    roundGroundPoint: (point) => point,
  });
  const moved = resolveLegacyPointerUpOutcome({
    dragEnd: { active: true, moved: true, clientX: 0, clientY: 0 },
    pickEntity: () => ({ id: 'x' }),
    pickGround: () => ({ x: 1, y: 0, z: 2 }),
    roundGroundPoint: (point) => point,
  });

  assert.deepEqual(inactive, { type: 'none' });
  assert.deepEqual(moved, { type: 'none' });
});

test('resolveLegacyPointerUpOutcome prioritizes entity selection', () => {
  const outcome = resolveLegacyPointerUpOutcome({
    dragEnd: { active: true, moved: false, clientX: 3, clientY: 4 },
    pickEntity: (clientX, clientY) => ({ id: `${clientX}:${clientY}` }),
    pickGround: () => ({ x: 2, y: 0, z: -1 }),
    roundGroundPoint: () => ({ x: 2, z: -1 }),
  });

  assert.deepEqual(outcome, {
    type: 'select-entity',
    entity: { id: '3:4' },
  });
});

test('resolveLegacyPointerUpOutcome returns ground click when no entity hit', () => {
  const outcome = resolveLegacyPointerUpOutcome({
    dragEnd: { active: true, moved: false, clientX: 6, clientY: 9 },
    pickEntity: () => null,
    pickGround: () => ({ x: 4.2, y: 0, z: -3.7 }),
    roundGroundPoint: () => ({ x: 4, z: -4 }),
  });

  assert.deepEqual(outcome, {
    type: 'ground-click',
    point: { x: 4, z: -4 },
  });
});

test('resolveLegacyPointerUpOutcome returns none when ground point is unavailable', () => {
  const outcome = resolveLegacyPointerUpOutcome({
    dragEnd: { active: true, moved: false, clientX: 6, clientY: 9 },
    pickEntity: () => null,
    pickGround: () => null,
    roundGroundPoint: () => null,
  });

  assert.deepEqual(outcome, { type: 'none' });
});

