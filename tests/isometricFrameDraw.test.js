import test from 'node:test';
import assert from 'node:assert/strict';
import { runIsometricFrameDraw } from '../src/render/isometricFrameDraw.js';

test('runIsometricFrameDraw executes draw phases and overlays in order', () => {
  const calls = [];
  const state = { day: 12 };
  const frame = { width: 900, height: 600, daylight: 0.7, now: 1234 };
  const hoveredEntity = { id: 'hovered' };
  const selectedEntity = { id: 'selected' };

  runIsometricFrameDraw({
    state,
    frame,
    drawBackground: (...args) => calls.push(['drawBackground', ...args]),
    drawTerrain: (...args) => calls.push(['drawTerrain', ...args]),
    drawEntities: (...args) => calls.push(['drawEntities', ...args]),
    drawPreview: (...args) => calls.push(['drawPreview', ...args]),
    hoveredEntity,
    selectedEntity,
    drawSelectionOverlay: (...args) => calls.push(['drawSelectionOverlay', ...args]),
    getSelectionPulse: (now) => {
      calls.push(['getSelectionPulse', now]);
      return 0.8;
    },
    drawTimeAndSeasonOverlays: (...args) => calls.push(['drawTimeAndSeasonOverlays', ...args]),
    ctx: 'ctx',
    getSeasonTint: (day) => {
      calls.push(['getSeasonTint', day]);
      return '#season';
    },
  });

  assert.deepEqual(calls, [
    ['drawBackground', state, 900, 600, 0.7],
    ['drawTerrain', state],
    ['drawEntities', state, 1234, 0.7],
    ['drawPreview'],
    ['getSelectionPulse', 1234],
    ['drawSelectionOverlay', hoveredEntity, 0.6000000000000001],
    ['getSelectionPulse', 1234],
    ['drawSelectionOverlay', selectedEntity, 0.8],
    ['getSeasonTint', 12],
    ['drawTimeAndSeasonOverlays', 'ctx', 900, 600, 0.30000000000000004, '#season'],
  ]);
});

test('runIsometricFrameDraw skips selection overlays when entities are missing', () => {
  const calls = [];
  runIsometricFrameDraw({
    state: { day: 1 },
    frame: { width: 10, height: 20, daylight: 1, now: 0 },
    drawBackground: () => calls.push('bg'),
    drawTerrain: () => calls.push('terrain'),
    drawEntities: () => calls.push('entities'),
    drawPreview: () => calls.push('preview'),
    hoveredEntity: null,
    selectedEntity: null,
    drawSelectionOverlay: () => calls.push('selection'),
    getSelectionPulse: () => 1,
    drawTimeAndSeasonOverlays: () => calls.push('overlay'),
    ctx: {},
    getSeasonTint: () => '#tint',
  });

  assert.deepEqual(calls, ['bg', 'terrain', 'entities', 'preview', 'overlay']);
});

