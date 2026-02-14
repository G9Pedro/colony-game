import test from 'node:test';
import assert from 'node:assert/strict';
import { CIVIC_BUILDING_DECORATION_HANDLERS } from '../src/render/spriteBuildingDecorationCivic.js';
import { ECONOMIC_BUILDING_DECORATION_HANDLERS } from '../src/render/spriteBuildingDecorationEconomic.js';

test('economic decoration handler set exports expected production building keys', () => {
  assert.ok(Object.isFrozen(ECONOMIC_BUILDING_DECORATION_HANDLERS));
  assert.deepEqual(Object.keys(ECONOMIC_BUILDING_DECORATION_HANDLERS).sort(), [
    'farm',
    'ironMine',
    'lumberCamp',
    'quarry',
    'warehouse',
    'workshop',
  ]);
});

test('civic decoration handler set exports expected settlement building keys', () => {
  assert.ok(Object.isFrozen(CIVIC_BUILDING_DECORATION_HANDLERS));
  assert.deepEqual(Object.keys(CIVIC_BUILDING_DECORATION_HANDLERS).sort(), [
    'apartment',
    'clinic',
    'library',
    'school',
    'shrine',
    'watchtower',
  ]);
  assert.equal(CIVIC_BUILDING_DECORATION_HANDLERS.school, CIVIC_BUILDING_DECORATION_HANDLERS.library);
});

