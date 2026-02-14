import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BUILDING_STYLE_OVERRIDES,
  JOB_COLORS,
  PREWARM_JOB_TYPES,
  PREWARM_RESOURCE_KEYS,
  RESOURCE_GLYPHS,
} from '../src/render/spriteFactoryConstants.js';

test('prewarm arrays mirror sprite factory job and resource maps', () => {
  assert.deepEqual(PREWARM_JOB_TYPES, Object.keys(JOB_COLORS));
  assert.deepEqual(PREWARM_RESOURCE_KEYS, Object.keys(RESOURCE_GLYPHS));
});

test('job color palette and resource glyph map provide expected keys', () => {
  assert.equal(JOB_COLORS.builder, '#f97316');
  assert.equal(JOB_COLORS.medic, '#db2777');
  assert.equal(RESOURCE_GLYPHS.wood, '🪵');
  assert.equal(RESOURCE_GLYPHS.knowledge, '📘');
});

test('building style overrides provide footprint and height style metadata', () => {
  assert.equal(BUILDING_STYLE_OVERRIDES.house.footprint, 0.92);
  assert.equal(BUILDING_STYLE_OVERRIDES.watchtower.height, 1.6);
  assert.equal(BUILDING_STYLE_OVERRIDES.library.roof, '#1d4ed8');
});

