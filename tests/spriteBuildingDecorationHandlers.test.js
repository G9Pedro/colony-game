import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BUILDING_DECORATION_HANDLERS,
  getBuildingDecorationHandler,
} from '../src/render/spriteBuildingDecorationHandlers.js';

test('getBuildingDecorationHandler resolves known types and null for unknown', () => {
  assert.equal(typeof getBuildingDecorationHandler('farm'), 'function');
  assert.equal(getBuildingDecorationHandler('unknown'), null);
});

test('school and library resolve to same decoration handler', () => {
  const schoolHandler = getBuildingDecorationHandler('school');
  const libraryHandler = getBuildingDecorationHandler('library');
  assert.equal(schoolHandler, libraryHandler);
});

test('BUILDING_DECORATION_HANDLERS exports immutable known decoration keys', () => {
  assert.ok(Object.isFrozen(BUILDING_DECORATION_HANDLERS));
  assert.ok('farm' in BUILDING_DECORATION_HANDLERS);
  assert.ok('watchtower' in BUILDING_DECORATION_HANDLERS);
  assert.equal('unknown' in BUILDING_DECORATION_HANDLERS, false);
});

